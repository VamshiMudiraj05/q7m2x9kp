import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    """Verify health check endpoint returns 200 and expected status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["targetEvaluationMonth"] == "January 2026"
    assert "cache" in data

def test_actuals_endpoint():
    """Verify actual generation endpoint returns January 2026 data."""
    response = client.get("/api/actuals?start_date=2026-01-01&end_date=2026-01-02")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset"] == "FUELHH"
    assert data["fuelType"] == "WIND"
    assert data["count"] > 0
    assert len(data["data"]) == data["count"]

def test_day_ahead_forecasts_endpoint():
    """Verify day-ahead forecasts endpoint returns data adhering to D-1 cutoff."""
    response = client.get("/api/forecasts/day-ahead?start_date=2026-01-01&end_date=2026-01-02&cutoff_hour=11")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset"] == "WINDFOR"
    assert "11:00 UTC on D-1" in data["decisionGate"]
    assert data["count"] > 0
    item = data["data"][0]
    assert "forecastGeneration" in item
    assert "publishTime" in item
    assert "leadTimeHours" in item

def test_accuracy_metrics_endpoint():
    """Verify metrics calculation endpoint returns MAE, RMSE, Bias, and percentiles."""
    response = client.get("/api/metrics/accuracy?start_date=2026-01-01&end_date=2026-01-07")
    assert response.status_code == 200
    data = response.json()
    assert "evaluationPeriod" in data
    metrics = data["metrics"]
    assert metrics["observationCount"] > 0
    assert metrics["mae"] is not None
    assert metrics["rmse"] is not None
    assert metrics["bias"] is not None
    assert metrics["wmape"] is not None
    assert "errorPercentiles" in metrics
    assert "p50_median" in metrics["errorPercentiles"]

def test_settlement_periods_endpoint():
    """Verify hourly/settlement period breakdown endpoint."""
    response = client.get("/api/metrics/settlement-periods?start_date=2026-01-01&end_date=2026-01-07")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    first_hour = data["data"][0]
    assert "hourOfDay" in first_hour
    assert "mae" in first_hour
    assert "bias" in first_hour

def test_daily_scorecard_endpoint():
    """Verify daily scorecard endpoint."""
    response = client.get("/api/metrics/daily?start_date=2026-01-01&end_date=2026-01-07")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 7
    first_day = data["data"][0]
    assert first_day["date"] == "2026-01-01"
    assert "mae" in first_day
    assert "rmse" in first_day

def test_aligned_series_endpoint():
    """Verify aligned time series for charting."""
    response = client.get("/api/metrics/aligned-series?start_date=2026-01-01&end_date=2026-01-02")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    first_point = data["data"][0]
    assert "actualGeneration" in first_point
    assert "forecastGeneration" in first_point
    assert "error" in first_point
