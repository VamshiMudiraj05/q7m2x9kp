import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.config import CACHE_DIR
from app.core.data_fetcher import ElexonDataFetcher

logger = logging.getLogger(__name__)

ACTUALS_CACHE_FILE = CACHE_DIR / "actuals_jan2026.json"
FORECASTS_CACHE_FILE = CACHE_DIR / "forecasts_jan2026.json"

class CacheService:
    """
    Manages local filesystem caching of Elexon actuals and forecasts
    to avoid repetitive external API calls and ensure instant query response.
    """

    def __init__(self, fetcher: Optional[ElexonDataFetcher] = None):
        self.fetcher = fetcher or ElexonDataFetcher()

    def get_actuals(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Retrieve January 2026 wind actuals from local cache if present,
        otherwise fetch from live Elexon BMRS API and save to cache.
        """
        if not force_refresh and ACTUALS_CACHE_FILE.exists():
            try:
                with open(ACTUALS_CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        logger.info("Loaded %d actuals from local cache %s", len(data), ACTUALS_CACHE_FILE)
                        return data
            except Exception as e:
                logger.warning("Error reading actuals cache: %s. Re-fetching from API.", e)

        # Fetch in 4 weekly chunks across January 2026 to ensure reliable transfer
        chunks = [
            ("2026-01-01T00:00:00Z", "2026-01-08T00:00:00Z"),
            ("2026-01-08T00:00:00Z", "2026-01-15T00:00:00Z"),
            ("2026-01-15T00:00:00Z", "2026-01-22T00:00:00Z"),
            ("2026-01-22T00:00:00Z", "2026-02-01T00:00:00Z"),
        ]
        
        all_actuals = []
        for start, end in chunks:
            chunk_data = self.fetcher.fetch_actual_generation_stream(start, end, fuel_type="WIND")
            all_actuals.extend(chunk_data)

        # Deduplicate by (startTime, settlementPeriod) keeping the latest publishTime
        unique_map = {}
        for item in all_actuals:
            st = item.get("startTime")
            if not st:
                continue
            if st not in unique_map or item.get("publishTime", "") > unique_map[st].get("publishTime", ""):
                unique_map[st] = item

        deduped = sorted(unique_map.values(), key=lambda x: x["startTime"])
        
        # Save to cache
        try:
            with open(ACTUALS_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(deduped, f, indent=2)
            logger.info("Cached %d deduped actuals to %s", len(deduped), ACTUALS_CACHE_FILE)
        except Exception as e:
            logger.error("Failed to write actuals cache: %s", e)

        return deduped

    def get_forecasts(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Retrieve January 2026 wind forecasts from local cache if present,
        otherwise fetch from live Elexon BMRS API and save to cache.
        """
        if not force_refresh and FORECASTS_CACHE_FILE.exists():
            try:
                with open(FORECASTS_CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        logger.info("Loaded %d forecasts from local cache %s", len(data), FORECASTS_CACHE_FILE)
                        return data
            except Exception as e:
                logger.warning("Error reading forecasts cache: %s. Re-fetching from API.", e)

        # Note: Day-ahead forecasts for Jan 1 00:00 were published on Dec 30 & Dec 31
        chunks = [
            ("2025-12-30T00:00:00Z", "2026-01-08T00:00:00Z"),
            ("2026-01-08T00:00:00Z", "2026-01-16T00:00:00Z"),
            ("2026-01-16T00:00:00Z", "2026-01-24T00:00:00Z"),
            ("2026-01-24T00:00:00Z", "2026-02-01T00:00:00Z"),
        ]

        all_forecasts = []
        for start, end in chunks:
            chunk_data = self.fetcher.fetch_forecast_generation_stream(start, end)
            all_forecasts.extend(chunk_data)

        # Deduplicate identical (startTime, publishTime) records
        unique_map = {}
        for item in all_forecasts:
            st = item.get("startTime")
            pt = item.get("publishTime")
            if not st or not pt:
                continue
            key = f"{st}_{pt}"
            unique_map[key] = item

        deduped = sorted(unique_map.values(), key=lambda x: (x["startTime"], x["publishTime"]))

        try:
            with open(FORECASTS_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(deduped, f, indent=2)
            logger.info("Cached %d deduped forecasts to %s", len(deduped), FORECASTS_CACHE_FILE)
        except Exception as e:
            logger.error("Failed to write forecasts cache: %s", e)

        return deduped
