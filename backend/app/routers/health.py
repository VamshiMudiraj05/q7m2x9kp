from fastapi import APIRouter
from app.services.cache_service import CacheService, ACTUALS_CACHE_FILE, FORECASTS_CACHE_FILE

router = APIRouter(prefix="/api", tags=["Health & Status"])

@router.get("/health")
def get_health():
    """
    Health check and operational status endpoint.
    Reports cache presence and count of available observations for January 2026.
    """
    actuals_cached = ACTUALS_CACHE_FILE.exists()
    forecasts_cached = FORECASTS_CACHE_FILE.exists()

    return {
        "status": "healthy",
        "service": "UK Day-Ahead Wind Forecast Evaluation API",
        "version": "1.0.0",
        "targetEvaluationMonth": "January 2026",
        "cache": {
            "actualsCached": actuals_cached,
            "forecastsCached": forecasts_cached
        }
    }
