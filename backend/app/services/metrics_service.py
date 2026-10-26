import math
import logging
from typing import List, Dict, Any, Optional
from app.config import MAPE_MIN_ACTUAL_MW

logger = logging.getLogger(__name__)

def calculate_percentile(sorted_values: List[float], p: float) -> float:
    """Calculate the p-th percentile (0.0 to 100.0) using linear interpolation."""
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return sorted_values[0]
        
    k = (len(sorted_values) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_values[int(k)]
    d0 = sorted_values[int(f)] * (c - k)
    d1 = sorted_values[int(c)] * (k - f)
    return round(d0 + d1, 2)

class MetricsService:
    """
    Computes rigorous statistical forecast accuracy metrics for Day-Ahead energy procurement.
    """

    @staticmethod
    def calculate_summary_metrics(
        aligned_data: List[Dict[str, Any]],
        mape_threshold: float = MAPE_MIN_ACTUAL_MW
    ) -> Dict[str, Any]:
        """
        Calculates MAE, RMSE, Bias, WMAPE, MAPE, and distribution percentiles
        over a list of matched forecast-actual observations.
        
        Args:
            aligned_data: List of dicts with 'actualGeneration', 'forecastGeneration', 'error'
            mape_threshold: Minimum actual generation in MW required to include in MAPE
            
        Returns:
            Dictionary of calculated metrics and sample metadata.
        """
        n = len(aligned_data)
        if n == 0:
            return {
                "observationCount": 0,
                "mae": None,
                "rmse": None,
                "bias": None,
                "wmape": None,
                "mape": None,
                "mapeExcludedCount": 0,
                "totalActualGeneration": 0.0,
                "totalForecastGeneration": 0.0,
                "maxAbsoluteError": None,
                "errorPercentiles": None,
                "status": "NO_DATA"
            }

        errors = [d["error"] for d in aligned_data]
        abs_errors = [d["absoluteError"] for d in aligned_data]
        sq_errors = [d["squaredError"] for d in aligned_data]
        actuals = [d["actualGeneration"] for d in aligned_data]
        forecasts = [d["forecastGeneration"] for d in aligned_data]

        mae = sum(abs_errors) / n
        rmse = math.sqrt(sum(sq_errors) / n)
        bias = sum(errors) / n  # Positive = Over-forecasting, Negative = Under-forecasting

        tot_actual = sum(actuals)
        tot_forecast = sum(forecasts)

        # Weighted MAPE (WMAPE) = Sum(|Errors|) / Sum(Actuals) * 100
        wmape = (sum(abs_errors) / tot_actual * 100.0) if tot_actual > 0 else None

        # Standard MAPE calculation with explicit near-zero filtering
        valid_mape_pairs = [
            (abs(d["error"]) / d["actualGeneration"] * 100.0)
            for d in aligned_data
            if d["actualGeneration"] >= mape_threshold
        ]
        excluded_mape_count = n - len(valid_mape_pairs)
        mape = (sum(valid_mape_pairs) / len(valid_mape_pairs)) if valid_mape_pairs else None

        # Sorted errors for percentile distribution
        sorted_errors = sorted(errors)
        percentiles = {
            "p10": calculate_percentile(sorted_errors, 10.0),
            "p25": calculate_percentile(sorted_errors, 25.0),
            "p50_median": calculate_percentile(sorted_errors, 50.0),
            "p75": calculate_percentile(sorted_errors, 75.0),
            "p90": calculate_percentile(sorted_errors, 90.0),
        }

        return {
            "observationCount": n,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "bias": round(bias, 2),
            "wmape": round(wmape, 2) if wmape is not None else None,
            "mape": round(mape, 2) if mape is not None else None,
            "mapeThresholdMW": mape_threshold,
            "mapeExcludedCount": excluded_mape_count,
            "totalActualGenerationMW": round(tot_actual, 2),
            "totalForecastGenerationMW": round(tot_forecast, 2),
            "maxAbsoluteErrorMW": round(max(abs_errors), 2),
            "errorPercentiles": percentiles,
            "units": {
                "mae": "MW",
                "rmse": "MW",
                "bias": "MW (Positive = Over-forecast, Negative = Under-forecast)",
                "wmape": "% of total volume",
                "mape": "% (filtered for actuals >= threshold)"
            },
            "status": "VALID"
        }

    @staticmethod
    def calculate_hourly_settlement_breakdown(
        aligned_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Groups metrics by hour of the day (0 to 23) or Settlement Period (1 to 48)
        to identify intraday structural bias patterns (e.g. morning ramp vs evening peak).
        """
        by_hour: Dict[int, List[Dict[str, Any]]] = {}
        for d in aligned_data:
            hour = d.get("hourOfDay", 0)
            by_hour.setdefault(hour, []).append(d)

        breakdown = []
        for hour in range(24):
            items = by_hour.get(hour, [])
            if not items:
                continue
            
            n = len(items)
            mae = sum(x["absoluteError"] for x in items) / n
            rmse = math.sqrt(sum(x["squaredError"] for x in items) / n)
            bias = sum(x["error"] for x in items) / n
            tot_act = sum(x["actualGeneration"] for x in items)
            wmape = (sum(x["absoluteError"] for x in items) / tot_act * 100.0) if tot_act > 0 else None
            
            breakdown.append({
                "hourOfDay": hour,
                "settlementPeriodEstimate": (hour * 2) + 1,
                "observationCount": n,
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "bias": round(bias, 2),
                "wmape": round(wmape, 2) if wmape is not None else None,
                "avgActualMW": round(tot_act / n, 2),
                "avgForecastMW": round(sum(x["forecastGeneration"] for x in items) / n, 2)
            })

        breakdown.sort(key=lambda x: x["hourOfDay"])
        return breakdown

    @staticmethod
    def calculate_daily_scorecard(
        aligned_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Groups metrics day-by-day across the evaluation month (January 2026).
        """
        by_date: Dict[str, List[Dict[str, Any]]] = {}
        for d in aligned_data:
            dt_str = d.get("settlementDate")
            if not dt_str:
                continue
            by_date.setdefault(dt_str, []).append(d)

        scorecard = []
        for dt_str in sorted(by_date.keys()):
            items = by_date[dt_str]
            n = len(items)
            mae = sum(x["absoluteError"] for x in items) / n
            rmse = math.sqrt(sum(x["squaredError"] for x in items) / n)
            bias = sum(x["error"] for x in items) / n
            tot_act = sum(x["actualGeneration"] for x in items)
            wmape = (sum(x["absoluteError"] for x in items) / tot_act * 100.0) if tot_act > 0 else None

            scorecard.append({
                "date": dt_str,
                "intervalsCount": n,
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "bias": round(bias, 2),
                "wmape": round(wmape, 2) if wmape is not None else None,
                "totalActualMW": round(tot_act, 2),
                "totalForecastMW": round(sum(x["forecastGeneration"] for x in items), 2)
            })

        return scorecard

    @staticmethod
    def calculate_lead_time_decay(
        aligned_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Groups aligned forecast-actual pairs into lead time horizon buckets
        to evaluate forecast decay as the settlement interval approaches.
        """
        buckets_def = [
            ("12h - 16h", 12.0, 16.0),
            ("16h - 20h", 16.0, 20.0),
            ("20h - 24h", 20.0, 24.0),
            ("24h - 28h", 24.0, 28.0),
            ("28h - 32h", 28.0, 32.0),
            ("32h - 36h", 32.0, 36.0),
            ("36h+", 36.0, 999.0),
        ]

        bucket_data: Dict[str, List[Dict[str, Any]]] = {b[0]: [] for b in buckets_def}
        for d in aligned_data:
            lt = d.get("leadTimeHours", 0.0)
            for label, low, high in buckets_def:
                if (label == "36h+" and lt >= low) or (low <= lt < high):
                    bucket_data[label].append(d)
                    break

        results = []
        for label, low, high in buckets_def:
            items = bucket_data[label]
            if not items:
                continue
            n = len(items)
            mae = sum(x["absoluteError"] for x in items) / n
            rmse = math.sqrt(sum(x["squaredError"] for x in items) / n)
            bias = sum(x["error"] for x in items) / n
            tot_act = sum(x["actualGeneration"] for x in items)
            wmape = (sum(x["absoluteError"] for x in items) / tot_act * 100.0) if tot_act > 0 else None
            avg_lt = sum(x.get("leadTimeHours", 0.0) for x in items) / n

            results.append({
                "bucket": label,
                "minHours": low,
                "maxHours": high if high < 900 else None,
                "avgLeadTimeHours": round(avg_lt, 1),
                "observationCount": n,
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "bias": round(bias, 2),
                "wmape": round(wmape, 2) if wmape is not None else None,
                "avgActualMW": round(tot_act / n, 2),
                "avgForecastMW": round(sum(x["forecastGeneration"] for x in items) / n, 2)
            })
        return results

    @staticmethod
    def generate_aligned_csv(aligned_data: List[Dict[str, Any]]) -> str:
        """
        Exports aligned actuals and Day-Ahead forecasts to an RFC 4180 CSV string.
        """
        import io
        import csv

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Start Time (UTC)",
            "Settlement Date",
            "Settlement Period",
            "Hour of Day",
            "Actual Generation (MW)",
            "Forecast Generation (MW)",
            "Forecast Error (MW)",
            "Absolute Error (MW)",
            "Publish Time (UTC)",
            "Decision Cutoff (UTC)",
            "Lead Time (Hours)"
        ])
        for row in aligned_data:
            writer.writerow([
                row.get("startTime", ""),
                row.get("settlementDate", ""),
                row.get("settlementPeriod", ""),
                row.get("hourOfDay", ""),
                row.get("actualGeneration", ""),
                row.get("forecastGeneration", ""),
                row.get("error", ""),
                row.get("absoluteError", ""),
                row.get("publishTime", ""),
                row.get("decisionCutoffTime", ""),
                row.get("leadTimeHours", "")
            ])
        return output.getvalue()

