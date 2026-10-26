import logging
import time
from typing import List, Dict, Any, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from app.config import ELEXON_BASE_URL, REQUEST_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)

class ElexonDataFetcher:
    """
    Robust HTTP client for retrieving actual generation and forecast datasets
    from the Elexon BMRS API (v1).
    """

    def __init__(self, base_url: str = ELEXON_BASE_URL, timeout: int = REQUEST_TIMEOUT_SECONDS):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()
        
        # Configure retry strategy for transient connection errors and 5xx server issues
        retries = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[500, 502, 503, 504],
            raise_on_status=False
        )
        adapter = HTTPAdapter(max_retries=retries)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "Wellfound-UK-DayAhead-WindForecast-App/1.0"
        })

    def fetch_actual_generation_stream(
        self,
        publish_from: str,
        publish_to: str,
        fuel_type: str = "WIND"
    ) -> List[Dict[str, Any]]:
        """
        Stream actual generation data from /datasets/FUELHH/stream and filter by fuelType.
        
        Args:
            publish_from: ISO 8601 string (e.g. '2026-01-01T00:00:00Z')
            publish_to: ISO 8601 string (e.g. '2026-01-08T00:00:00Z')
            fuel_type: Target fuel category (default 'WIND')
            
        Returns:
            List of validated dictionary records matching fuel_type.
        """
        endpoint = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        
        try:
            logger.info("Fetching FUELHH stream from %s to %s", publish_from, publish_to)
            response = self.session.get(endpoint, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            payload = response.json()
            if not isinstance(payload, list):
                logger.warning("Unexpected payload format from FUELHH: %s", type(payload))
                return []
                
            filtered = [
                item for item in payload
                if item.get("fuelType") == fuel_type and item.get("generation") is not None
            ]
            logger.info("Retrieved %d FUELHH records, %d match fuelType=%s", len(payload), len(filtered), fuel_type)
            return filtered
            
        except requests.exceptions.RequestException as exc:
            logger.error("Failed to fetch FUELHH stream (%s to %s): %s", publish_from, publish_to, exc)
            raise

    def fetch_forecast_generation_stream(
        self,
        publish_from: str,
        publish_to: str
    ) -> List[Dict[str, Any]]:
        """
        Stream wind forecast data from /datasets/WINDFOR/stream.
        
        Args:
            publish_from: ISO 8601 string
            publish_to: ISO 8601 string
            
        Returns:
            List of forecast dictionary records containing startTime, publishTime, generation.
        """
        endpoint = f"{self.base_url}/datasets/WINDFOR/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        
        try:
            logger.info("Fetching WINDFOR stream from %s to %s", publish_from, publish_to)
            response = self.session.get(endpoint, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            payload = response.json()
            if not isinstance(payload, list):
                logger.warning("Unexpected payload format from WINDFOR: %s", type(payload))
                return []
                
            valid_items = [
                item for item in payload
                if "startTime" in item and "publishTime" in item and item.get("generation") is not None
            ]
            logger.info("Retrieved %d WINDFOR records", len(valid_items))
            return valid_items
            
        except requests.exceptions.RequestException as exc:
            logger.error("Failed to fetch WINDFOR stream (%s to %s): %s", publish_from, publish_to, exc)
            raise
