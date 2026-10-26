import pytest
import requests
from unittest.mock import Mock, patch
from app.core.data_fetcher import ElexonDataFetcher

def test_fetch_actual_generation_filters_wind_correctly():
    """Verify that only fuelType == 'WIND' records with valid generation are returned."""
    mock_payload = [
        {"dataset": "FUELHH", "fuelType": "WIND", "generation": 14200, "startTime": "2026-01-01T00:00:00Z"},
        {"dataset": "FUELHH", "fuelType": "NUCLEAR", "generation": 5000, "startTime": "2026-01-01T00:00:00Z"},
        {"dataset": "FUELHH", "fuelType": "CCGT", "generation": 12000, "startTime": "2026-01-01T00:00:00Z"},
        {"dataset": "FUELHH", "fuelType": "WIND", "generation": None, "startTime": "2026-01-01T00:30:00Z"},
        {"dataset": "FUELHH", "fuelType": "WIND", "generation": 13850, "startTime": "2026-01-01T01:00:00Z"},
    ]

    fetcher = ElexonDataFetcher(base_url="https://mock.elexon.test")
    
    with patch.object(fetcher.session, "get") as mock_get:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_payload
        mock_get.return_value = mock_response

        results = fetcher.fetch_actual_generation_stream("2026-01-01T00:00:00Z", "2026-01-01T02:00:00Z")

        assert len(results) == 2
        assert all(r["fuelType"] == "WIND" for r in results)
        assert results[0]["generation"] == 14200
        assert results[1]["generation"] == 13850

def test_fetch_forecast_generation_validates_required_fields():
    """Verify that forecasts missing critical fields are filtered out."""
    mock_payload = [
        {"dataset": "WINDFOR", "startTime": "2026-01-01T00:00:00Z", "publishTime": "2025-12-31T09:30:00Z", "generation": 15000},
        {"dataset": "WINDFOR", "startTime": "2026-01-01T01:00:00Z", "generation": 15200}, # Missing publishTime
        {"dataset": "WINDFOR", "publishTime": "2025-12-31T09:30:00Z", "generation": 15200}, # Missing startTime
        {"dataset": "WINDFOR", "startTime": "2026-01-01T02:00:00Z", "publishTime": "2025-12-31T09:30:00Z", "generation": None},
    ]

    fetcher = ElexonDataFetcher(base_url="https://mock.elexon.test")
    
    with patch.object(fetcher.session, "get") as mock_get:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_payload
        mock_get.return_value = mock_response

        results = fetcher.fetch_forecast_generation_stream("2025-12-31T00:00:00Z", "2026-01-01T00:00:00Z")

        assert len(results) == 1
        assert results[0]["startTime"] == "2026-01-01T00:00:00Z"
        assert results[0]["generation"] == 15000

def test_fetcher_handles_http_errors_gracefully():
    """Verify that HTTP 500 error raises an exception that can be caught."""
    fetcher = ElexonDataFetcher(base_url="https://mock.elexon.test")

    with patch.object(fetcher.session, "get") as mock_get:
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("Server error 500")
        mock_get.return_value = mock_response

        with pytest.raises(requests.exceptions.HTTPError):
            fetcher.fetch_actual_generation_stream("2026-01-01T00:00:00Z", "2026-01-01T02:00:00Z")

def test_fetcher_handles_timeout_error():
    """Verify that network timeouts are handled."""
    fetcher = ElexonDataFetcher(base_url="https://mock.elexon.test")

    with patch.object(fetcher.session, "get") as mock_get:
        mock_get.side_effect = requests.exceptions.Timeout("Connection timed out")

        with pytest.raises(requests.exceptions.Timeout):
            fetcher.fetch_forecast_generation_stream("2026-01-01T00:00:00Z", "2026-01-01T02:00:00Z")
