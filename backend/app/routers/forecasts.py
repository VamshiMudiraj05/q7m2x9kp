from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.services.cache_service import CacheService
from app.services.forecast_service import ForecastService
from app.config import (
    DEFAULT_START_DATE,
    DEFAULT_END_DATE,
    DEFAULT_DAY_AHEAD_CUTOFF_HOUR,
    DEFAULT_DAY_AHEAD_CUTOFF_MINUTE
)

router = APIRouter(prefix="/api/forecasts", tags=["Forecasted Generation (WINDFOR)"])

@router.get("/day-ahead")
def get_day_ahead_forecasts(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD (e.g. 2026-01-01)"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD (e.g. 2026-01-31)"),
    cutoff_hour: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_HOUR, ge=0, le=23, description="Decision cutoff hour UTC on D-1 (e.g. 11 for 11:00 UTC)"),
    cutoff_minute: int = Query(DEFAULT_DAY_AHEAD_CUTOFF_MINUTE, ge=0, le=59, description="Decision cutoff minute UTC on D-1"),
    refresh: bool = Query(False, description="Force refresh from live Elexon BMRS API")
):
    """
    Retrieves the operational Day-Ahead wind generation forecast available to power purchasers.
    
    Decision Gate:
    For target delivery on day D, only forecasts published <= cutoff_hour:cutoff_minute UTC on D-1
    are considered. Among those, the latest published forecast is selected.
    """
    try:
        cache_service = CacheService()
        raw_forecasts = cache_service.get_forecasts(force_refresh=refresh)
        
        forecast_service = ForecastService(cutoff_hour=cutoff_hour, cutoff_minute=cutoff_minute)
        selected = forecast_service.select_day_ahead_forecasts(
            raw_forecasts,
            start_date=start_date or DEFAULT_START_DATE,
            end_date=end_date or DEFAULT_END_DATE
        )

        return {
            "dataset": "WINDFOR",
            "decisionGate": f"{cutoff_hour:02d}:{cutoff_minute:02d} UTC on D-1",
            "count": len(selected),
            "startDate": start_date or DEFAULT_START_DATE,
            "endDate": end_date or DEFAULT_END_DATE,
            "data": selected
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve day-ahead forecasts: {str(exc)}")
