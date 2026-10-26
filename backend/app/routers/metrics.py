from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Response
from app.services.cache_service import CacheService
from app.services.forecast_service import ForecastService
from app.services.metrics_service import MetricsService
from app.config import (
    DEFAULT_START_DATE,
    DEFAULT_END_DATE,
    DEFAULT_DAY_AHEAD_CUTOFF_HOUR,
    DEFAULT_DAY_AHEAD_CUTOFF_MINUTE,
    MAPE_MIN_ACTUAL_MW
)

router = APIRouter(prefix="/api/metrics", tags=["Forecast Accuracy & Error Evaluation"])

def _get_aligned_data(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    cutoff_hour: int = DEFAULT_DAY_AHEAD_CUTOFF_HOUR,
    cutoff_minute: int = DEFAULT_DAY_AHEAD_CUTOFF_MINUTE,
    refresh: bool = False
):
    cache_service = CacheService()
    actuals = cache_service.get_actuals(force_refresh=refresh)
    forecasts = cache_service.get_forecasts(force_refresh=refresh)

    forecast_service = ForecastService(cutoff_hour=cutoff_hour, cutoff_minute=cutoff_minute)
    aligned = forecast_service.align_forecast_and_actuals(
        actual_records=actuals,
        forecast_records=forecasts,
        start_date=start_date or DEFAULT_START_DATE,
        end_date=end_date or DEFAULT_END_DATE
    )
    return aligned

@router.get("/accuracy")
def get_accuracy_metrics(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    cutoff_hour: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_HOUR, ge=0, le=23, description="Decision cutoff hour UTC on D-1"),
    cutoff_minute: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_MINUTE, ge=0, le=59, description="Decision cutoff minute UTC on D-1"),
    mape_threshold: float = Query(MAPE_MIN_ACTUAL_MW, ge=0.0, description="Minimum actual generation MW for standard MAPE calculation"),
    refresh: bool = Query(False, description="Force refresh from live Elexon BMRS API")
):
    """
    Computes summary quantitative forecast accuracy metrics (MAE, RMSE, Bias, WMAPE, MAPE, Percentiles)
    for power procurement decisions in January 2026.
    """
    try:
        aligned = _get_aligned_data(start_date, end_date, cutoff_hour, cutoff_minute, refresh)
        metrics = MetricsService.calculate_summary_metrics(aligned, mape_threshold=mape_threshold)
        
        return {
            "evaluationPeriod": {
                "startDate": start_date or DEFAULT_START_DATE,
                "endDate": end_date or DEFAULT_END_DATE,
                "dayAheadGate": f"{cutoff_hour:02d}:{cutoff_minute:02d} UTC on D-1"
            },
            "metrics": metrics
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to calculate accuracy metrics: {str(exc)}")

@router.get("/settlement-periods")
def get_settlement_period_breakdown(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    cutoff_hour: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_HOUR, ge=0, le=23),
    cutoff_minute: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_MINUTE, ge=0, le=59)
):
    """
    Returns forecast error breakdown across intraday hours and settlement periods.
    Identifies diurnal biases (e.g. morning ramp vs evening peak).
    """
    try:
        aligned = _get_aligned_data(start_date, end_date, cutoff_hour, cutoff_minute)
        breakdown = MetricsService.calculate_hourly_settlement_breakdown(aligned)
        return {
            "evaluationPeriod": {
                "startDate": start_date or DEFAULT_START_DATE,
                "endDate": end_date or DEFAULT_END_DATE,
                "dayAheadGate": f"{cutoff_hour:02d}:{cutoff_minute:02d} UTC on D-1"
            },
            "count": len(breakdown),
            "data": breakdown
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to calculate settlement breakdown: {str(exc)}")

@router.get("/daily")
def get_daily_scorecard(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    cutoff_hour: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_HOUR, ge=0, le=23),
    cutoff_minute: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_MINUTE, ge=0, le=59)
):
    """
    Returns day-by-day accuracy scorecard for January 2026.
    """
    try:
        aligned = _get_aligned_data(start_date, end_date, cutoff_hour, cutoff_minute)
        scorecard = MetricsService.calculate_daily_scorecard(aligned)
        return {
            "count": len(scorecard),
            "data": scorecard
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to calculate daily scorecard: {str(exc)}")

@router.get("/aligned-series")
def get_aligned_time_series(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    cutoff_hour: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_HOUR, ge=0, le=23),
    cutoff_minute: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_MINUTE, ge=0, le=59)
):
    """
    Returns time-series pairs of (Actual, Forecast, Error) for charts and visualizations.
    """
    try:
        aligned = _get_aligned_data(start_date, end_date, cutoff_hour, cutoff_minute)
        return {
            "count": len(aligned),
            "data": aligned
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve aligned series: {str(exc)}")

@router.get("/lead-time-decay")
def get_lead_time_decay(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    cutoff_hour: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_HOUR, ge=0, le=23),
    cutoff_minute: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_MINUTE, ge=0, le=59)
):
    """
    Returns forecast error breakdown across forecast horizon / lead time buckets (hours prior to settlement).
    Reveals error decay characteristics as the delivery window approaches.
    """
    try:
        aligned = _get_aligned_data(start_date, end_date, cutoff_hour, cutoff_minute)
        decay_data = MetricsService.calculate_lead_time_decay(aligned)
        return {
            "count": len(decay_data),
            "data": decay_data
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to calculate lead-time decay: {str(exc)}")

@router.get("/export-csv")
def export_aligned_csv(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    cutoff_hour: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_HOUR, ge=0, le=23),
    cutoff_minute: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_MINUTE, ge=0, le=59)
):
    """
    Exports aligned actuals and forecasts for quantitative analysts and traders as an RFC 4180 CSV file.
    """
    try:
        aligned = _get_aligned_data(start_date, end_date, cutoff_hour, cutoff_minute)
        csv_content = MetricsService.generate_aligned_csv(aligned)
        filename = f"GridWind_UK_Jan2026_Evaluation_{cutoff_hour:02d}{cutoff_minute:02d}Gate.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to export CSV: {str(exc)}")

