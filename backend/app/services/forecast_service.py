import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, date, time, timezone, timedelta
from app.config import DEFAULT_DAY_AHEAD_CUTOFF_HOUR, DEFAULT_DAY_AHEAD_CUTOFF_MINUTE

logger = logging.getLogger(__name__)

def parse_iso_utc(ts_str: str) -> datetime:
    """Safely parse an ISO 8601 timestamp string into a timezone-aware UTC datetime."""
    clean_str = ts_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(clean_str)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

class ForecastService:
    """
    Handles day-ahead forecast filtering, decision cutoff alignment,
    and pairing with actual outturn wind generation.
    """

    def __init__(
        self,
        cutoff_hour: int = DEFAULT_DAY_AHEAD_CUTOFF_HOUR,
        cutoff_minute: int = DEFAULT_DAY_AHEAD_CUTOFF_MINUTE
    ):
        self.cutoff_hour = cutoff_hour
        self.cutoff_minute = cutoff_minute

    def get_decision_cutoff(self, target_delivery_date: date) -> datetime:
        """
        Calculates the Day-Ahead decision cutoff datetime for a target delivery day D.
        The cutoff occurs on D-1 at cutoff_hour:cutoff_minute UTC.
        """
        d_minus_1 = target_delivery_date - timedelta(days=1)
        return datetime(
            d_minus_1.year,
            d_minus_1.month,
            d_minus_1.day,
            self.cutoff_hour,
            self.cutoff_minute,
            0,
            tzinfo=timezone.utc
        )

    def select_day_ahead_forecasts(
        self,
        forecast_records: List[Dict[str, Any]],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Selects the operational Day-Ahead forecast for each delivery interval.
        
        Decision Rule:
        For target delivery on day D, the trader only has access to forecasts published
        on or before the D-1 decision cutoff (e.g. 11:00 UTC D-1).
        Among eligible forecasts, the one with the latest publishTime is selected.
        Forecasts published after the cutoff (e.g. intraday or afternoon D-1) are excluded.
        """
        # Group forecasts by target startTime
        by_start_time: Dict[str, List[Dict[str, Any]]] = {}
        for rec in forecast_records:
            st = rec.get("startTime")
            if not st:
                continue
            by_start_time.setdefault(st, []).append(rec)

        selected_forecasts = []
        
        for st_str, candidates in by_start_time.items():
            st_dt = parse_iso_utc(st_str)
            delivery_date = st_dt.date()

            # Date range filtering
            if start_date and delivery_date < date.fromisoformat(start_date):
                continue
            if end_date and delivery_date > date.fromisoformat(end_date):
                continue

            cutoff_dt = self.get_decision_cutoff(delivery_date)

            # Filter candidates published <= cutoff_dt
            eligible = []
            for cand in candidates:
                pt_str = cand.get("publishTime")
                if not pt_str:
                    continue
                pt_dt = parse_iso_utc(pt_str)
                if pt_dt <= cutoff_dt:
                    eligible.append((pt_dt, cand))

            if not eligible:
                # No forecast was available prior to the D-1 cutoff for this interval
                continue

            # Pick candidate with max publishTime deterministically:
            # Primary sort: publishTime (latest)
            # Secondary tie-breaker: generation value
            # Tertiary tie-breaker: dataset name
            eligible.sort(
                key=lambda x: (
                    x[0],
                    float(x[1].get("generation", 0.0)),
                    str(x[1].get("dataset", ""))
                ),
                reverse=True
            )
            chosen_pt_dt, chosen_cand = eligible[0]

            lead_time_hours = round((st_dt - chosen_pt_dt).total_seconds() / 3600.0, 2)

            selected_forecasts.append({
                "startTime": st_str,
                "targetDate": delivery_date.isoformat(),
                "forecastGeneration": float(chosen_cand.get("generation", 0.0)),
                "publishTime": chosen_cand.get("publishTime"),
                "decisionCutoffTime": cutoff_dt.isoformat().replace("+00:00", "Z"),
                "leadTimeHours": lead_time_hours,
                "dataset": "WINDFOR"
            })

        selected_forecasts.sort(key=lambda x: x["startTime"])
        return selected_forecasts

    def align_forecast_and_actuals(
        self,
        actual_records: List[Dict[str, Any]],
        forecast_records: List[Dict[str, Any]],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        resolution: str = "half_hourly"
    ) -> List[Dict[str, Any]]:
        """
        Aligns Day-Ahead selected forecasts with actual wind generation outturns.
        
        Supports two temporal resolutions:
        - 'half_hourly' (default): Evaluates each half-hourly settlement period (48 per day,
          1,488 for January 2026). Since National Grid WINDFOR forecasts are published at hourly
          resolution, each hourly forecast applies to both half-hourly settlement periods
          in that hour (e.g. 00:00 applies to SP 1 [00:00] and SP 2 [00:30]).
        - 'hourly_aggregated': Aggregates the two half-hourly actuals in each hour into an
          hourly average (A_00 + A_30) / 2 and evaluates against the hourly forecast (744 observations).
        
        Error Sign Convention:
        error = forecast - actual
        - Positive (> 0): Over-forecasting (utility expected more wind than actual -> leaves trader short)
        - Negative (< 0): Under-forecasting (utility expected less wind than actual -> spill / surplus)
        """
        day_ahead_forecasts = self.select_day_ahead_forecasts(
            forecast_records,
            start_date=start_date,
            end_date=end_date
        )
        forecasts_by_hour: Dict[str, Dict[str, Any]] = {
            fc["startTime"]: fc for fc in day_ahead_forecasts
        }

        # Filter and validate actuals within requested delivery dates
        filtered_actuals = []
        for act in actual_records:
            st = act.get("startTime")
            if not st:
                continue
            st_dt = parse_iso_utc(st)
            delivery_date = st_dt.date()
            if start_date and delivery_date < date.fromisoformat(start_date):
                continue
            if end_date and delivery_date > date.fromisoformat(end_date):
                continue
            filtered_actuals.append((st_dt, act))

        filtered_actuals.sort(key=lambda x: x[0])

        matched_series = []

        if resolution == "hourly_aggregated":
            # Group half-hourly actuals by hour
            actuals_by_hour: Dict[str, List[Any]] = {}
            for st_dt, act in filtered_actuals:
                hour_str = f"{st_dt.year:04d}-{st_dt.month:02d}-{st_dt.day:02d}T{st_dt.hour:02d}:00:00Z"
                actuals_by_hour.setdefault(hour_str, []).append((st_dt, act))

            for hour_str in sorted(actuals_by_hour.keys()):
                acts = actuals_by_hour[hour_str]
                fc = forecasts_by_hour.get(hour_str)
                if not fc:
                    continue

                act_gens = [float(a[1].get("generation", 0.0)) for a in acts]
                avg_act_gen = sum(act_gens) / len(act_gens)
                fc_gen = float(fc["forecastGeneration"])
                err = fc_gen - avg_act_gen

                h_dt = parse_iso_utc(hour_str)
                pt_dt = parse_iso_utc(fc["publishTime"])
                lead_time_hours = round((h_dt - pt_dt).total_seconds() / 3600.0, 2)

                matched_series.append({
                    "startTime": hour_str,
                    "settlementDate": acts[0][1].get("settlementDate", h_dt.date().isoformat()),
                    "settlementPeriod": (h_dt.hour * 2) + 1,
                    "hourOfDay": h_dt.hour,
                    "actualGeneration": round(avg_act_gen, 2),
                    "forecastGeneration": fc_gen,
                    "error": round(err, 2),
                    "absoluteError": round(abs(err), 2),
                    "squaredError": round(err ** 2, 2),
                    "publishTime": fc["publishTime"],
                    "decisionCutoffTime": fc["decisionCutoffTime"],
                    "leadTimeHours": lead_time_hours,
                    "intervalDurationHours": 1.0,
                    "resolution": "hourly_aggregated"
                })

        else:
            # Default: half-hourly settlement resolution (1,488 observations for Jan 2026)
            for st_dt, act in filtered_actuals:
                st = act["startTime"]
                # Match to the applicable hourly forecast block
                hour_str = f"{st_dt.year:04d}-{st_dt.month:02d}-{st_dt.day:02d}T{st_dt.hour:02d}:00:00Z"
                fc = forecasts_by_hour.get(hour_str)
                if not fc:
                    continue

                act_gen = float(act.get("generation", 0.0))
                fc_gen = float(fc["forecastGeneration"])
                err = fc_gen - act_gen

                sp = act.get("settlementPeriod")
                if sp is None:
                    sp = (st_dt.hour * 2) + (1 if st_dt.minute == 0 else 2)

                pt_dt = parse_iso_utc(fc["publishTime"])
                lead_time_hours = round((st_dt - pt_dt).total_seconds() / 3600.0, 2)

                matched_series.append({
                    "startTime": st,
                    "settlementDate": act.get("settlementDate", st_dt.date().isoformat()),
                    "settlementPeriod": sp,
                    "hourOfDay": st_dt.hour,
                    "actualGeneration": act_gen,
                    "forecastGeneration": fc_gen,
                    "error": round(err, 2),
                    "absoluteError": round(abs(err), 2),
                    "squaredError": round(err ** 2, 2),
                    "publishTime": fc["publishTime"],
                    "decisionCutoffTime": fc["decisionCutoffTime"],
                    "leadTimeHours": lead_time_hours,
                    "intervalDurationHours": 0.5,
                    "resolution": "half_hourly"
                })

        matched_series.sort(key=lambda x: x["startTime"])
        return matched_series
