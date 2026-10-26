from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from datetime import date
from app.services.cache_service import CacheService
from app.config import DEFAULT_START_DATE, DEFAULT_END_DATE

router = APIRouter(prefix="/api/actuals", tags=["Actual Generation (FUELHH)"])

@router.get("")
def get_actual_generation(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD (e.g. 2026-01-01)"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD (e.g. 2026-01-31)"),
    refresh: bool = Query(False, description="Force refresh from live Elexon BMRS API")
):
    """
    Retrieves validated national wind generation actuals from Elexon FUELHH stream.
    Half-hour resolution with settlement periods 1 to 48.
    """
    try:
        cache_service = CacheService()
        records = cache_service.get_actuals(force_refresh=refresh)
        
        filtered = records
        if start_date:
            s_date = date.fromisoformat(start_date)
            filtered = [r for r in filtered if date.fromisoformat(r["startTime"][:10]) >= s_date]
        if end_date:
            e_date = date.fromisoformat(end_date)
            filtered = [r for r in filtered if date.fromisoformat(r["startTime"][:10]) <= e_date]

        return {
            "dataset": "FUELHH",
            "fuelType": "WIND",
            "count": len(filtered),
            "startDate": start_date or DEFAULT_START_DATE,
            "endDate": end_date or DEFAULT_END_DATE,
            "data": filtered
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve actuals: {str(exc)}")
