import pytest
from datetime import date
from app.services.forecast_service import ForecastService, parse_iso_utc

def test_parse_iso_utc_normalizes_timestamps():
    """Verify ISO 8601 UTC timestamp parsing."""
    dt1 = parse_iso_utc("2026-01-01T12:00:00Z")
    assert dt1.year == 2026
    assert dt1.month == 1
    assert dt1.day == 1
    assert dt1.hour == 12
    assert dt1.tzinfo is not None

    dt2 = parse_iso_utc("2026-01-01T12:00:00+00:00")
    assert dt1 == dt2

def test_decision_cutoff_calculated_for_d_minus_1():
    """Verify that delivery on day D has cutoff on day D-1 at specified hour."""
    svc = ForecastService(cutoff_hour=11, cutoff_minute=0)
    cutoff = svc.get_decision_cutoff(date(2026, 1, 5))
    
    assert cutoff.year == 2026
    assert cutoff.month == 1
    assert cutoff.day == 4
    assert cutoff.hour == 11
    assert cutoff.minute == 0

def test_select_day_ahead_forecasts_enforces_gate_closure_without_lookahead():
    """
    Simulates multiple forecast publications for target interval 2026-01-02T14:00:00Z.
    Decision gate is 2026-01-01 at 11:00:00Z.
    Candidate publications:
    - 2025-12-31T22:30:00Z (eligible, but older)
    - 2026-01-01T04:30:00Z (eligible)
    - 2026-01-01T09:30:00Z (eligible, LATEST before 11:00 -> MUST BE SELECTED)
    - 2026-01-01T15:30:00Z (published AFTER 11:00 D-1 -> MUST BE REJECTED)
    - 2026-01-02T08:00:00Z (published intraday on delivery day -> MUST BE REJECTED)
    """
    svc = ForecastService(cutoff_hour=11, cutoff_minute=0)
    
    forecast_candidates = [
        {"dataset": "WINDFOR", "startTime": "2026-01-02T14:00:00Z", "publishTime": "2025-12-31T22:30:00Z", "generation": 10000},
        {"dataset": "WINDFOR", "startTime": "2026-01-02T14:00:00Z", "publishTime": "2026-01-01T04:30:00Z", "generation": 11000},
        {"dataset": "WINDFOR", "startTime": "2026-01-02T14:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 12500},
        {"dataset": "WINDFOR", "startTime": "2026-01-02T14:00:00Z", "publishTime": "2026-01-01T15:30:00Z", "generation": 14000},
        {"dataset": "WINDFOR", "startTime": "2026-01-02T14:00:00Z", "publishTime": "2026-01-02T08:00:00Z", "generation": 15000},
    ]

    selected = svc.select_day_ahead_forecasts(forecast_candidates)

    assert len(selected) == 1
    chosen = selected[0]
    assert chosen["startTime"] == "2026-01-02T14:00:00Z"
    assert chosen["publishTime"] == "2026-01-01T09:30:00Z"
    assert chosen["forecastGeneration"] == 12500.0
    # Lead time: between 2026-01-01 09:30 and 2026-01-02 14:00 = 28.5 hours
    assert chosen["leadTimeHours"] == 28.5

def test_align_forecast_and_actuals_computes_exact_error():
    """Verify that aligned series calculates error = forecast - actual and absolute error."""
    svc = ForecastService(cutoff_hour=11, cutoff_minute=0)

    actuals = [
        {"startTime": "2026-01-02T10:00:00Z", "settlementDate": "2026-01-02", "settlementPeriod": 21, "generation": 10000.0},
        {"startTime": "2026-01-02T11:00:00Z", "settlementDate": "2026-01-02", "settlementPeriod": 23, "generation": 8000.0},
    ]

    forecasts = [
        {"startTime": "2026-01-02T10:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 12000.0},
        {"startTime": "2026-01-02T11:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 7500.0},
    ]

    aligned = svc.align_forecast_and_actuals(actuals, forecasts)

    assert len(aligned) == 2
    # Item 1: Over-forecasting: 12000 - 10000 = +2000
    assert aligned[0]["actualGeneration"] == 10000.0
    assert aligned[0]["forecastGeneration"] == 12000.0
    assert aligned[0]["error"] == 2000.0
    assert aligned[0]["absoluteError"] == 2000.0

    # Item 2: Under-forecasting: 7500 - 8000 = -500
    assert aligned[1]["actualGeneration"] == 8000.0
    assert aligned[1]["forecastGeneration"] == 7500.0
    assert aligned[1]["error"] == -500.0
    assert aligned[1]["absoluteError"] == 500.0

def test_handles_missing_forecast_gracefully():
    """If no forecast exists before the decision cutoff, interval is omitted from matched output."""
    svc = ForecastService(cutoff_hour=11, cutoff_minute=0)

    actuals = [{"startTime": "2026-01-03T10:00:00Z", "settlementPeriod": 21, "generation": 5000}]
    # Forecast only published AFTER delivery time
    forecasts = [{"startTime": "2026-01-03T10:00:00Z", "publishTime": "2026-01-03T12:00:00Z", "generation": 5200}]

    aligned = svc.align_forecast_and_actuals(actuals, forecasts)
    assert len(aligned) == 0
