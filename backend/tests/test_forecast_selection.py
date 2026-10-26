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

def test_duplicate_publish_timestamps_deterministic_tie_break():
    """
    When multiple forecast candidates for the same delivery interval have identical
    publishTime, selection must be strictly deterministic across repeated runs.
    """
    svc = ForecastService(cutoff_hour=11, cutoff_minute=0)
    candidates = [
        {"dataset": "WINDFOR", "startTime": "2026-01-02T14:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 12000.0},
        {"dataset": "WINDFOR", "startTime": "2026-01-02T14:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 12500.0},
    ]

    selected_1 = svc.select_day_ahead_forecasts(candidates)
    selected_2 = svc.select_day_ahead_forecasts(list(reversed(candidates)))

    assert len(selected_1) == 1
    assert len(selected_2) == 1
    assert selected_1[0]["forecastGeneration"] == selected_2[0]["forecastGeneration"]
    assert selected_1[0]["forecastGeneration"] == 12500.0

def test_cutoff_boundary_exact_second_enforcement():
    """
    Verify boundary condition:
    Cutoff on D-1 is 11:00:00Z.
    - Publication at 11:00:00Z is ELIGIBLE (<= cutoff).
    - Publication at 11:00:01Z is INELIGIBLE (> cutoff, lookahead).
    """
    svc = ForecastService(cutoff_hour=11, cutoff_minute=0)
    target_st = "2026-01-05T12:00:00Z"

    # Eligible: exactly at 11:00:00Z
    cand_eligible = [
        {"dataset": "WINDFOR", "startTime": target_st, "publishTime": "2026-01-04T11:00:00Z", "generation": 10000.0}
    ]
    res_eligible = svc.select_day_ahead_forecasts(cand_eligible)
    assert len(res_eligible) == 1
    assert res_eligible[0]["forecastGeneration"] == 10000.0

    # Ineligible: 1 second past cutoff
    cand_ineligible = [
        {"dataset": "WINDFOR", "startTime": target_st, "publishTime": "2026-01-04T11:00:01Z", "generation": 10500.0}
    ]
    res_ineligible = svc.select_day_ahead_forecasts(cand_ineligible)
    assert len(res_ineligible) == 0

def test_half_hourly_alignment_maps_both_settlement_periods():
    """
    Hourly WINDFOR forecast for 10:00:00Z applies to both:
    - Settlement Period 21 (10:00:00Z)
    - Settlement Period 22 (10:30:00Z)
    Each settlement period evaluates against its own actual generation.
    """
    svc = ForecastService(cutoff_hour=11, cutoff_minute=0)
    forecasts = [
        {"startTime": "2026-01-02T10:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 12000.0}
    ]
    actuals = [
        {"startTime": "2026-01-02T10:00:00Z", "settlementDate": "2026-01-02", "settlementPeriod": 21, "generation": 10000.0},
        {"startTime": "2026-01-02T10:30:00Z", "settlementDate": "2026-01-02", "settlementPeriod": 22, "generation": 10500.0},
    ]

    aligned = svc.align_forecast_and_actuals(actuals, forecasts, resolution="half_hourly")

    assert len(aligned) == 2
    # First half-hour (SP 21)
    assert aligned[0]["settlementPeriod"] == 21
    assert aligned[0]["actualGeneration"] == 10000.0
    assert aligned[0]["forecastGeneration"] == 12000.0
    assert aligned[0]["error"] == 2000.0
    assert aligned[0]["intervalDurationHours"] == 0.5

    # Second half-hour (SP 22)
    assert aligned[1]["settlementPeriod"] == 22
    assert aligned[1]["actualGeneration"] == 10500.0
    assert aligned[1]["forecastGeneration"] == 12000.0
    assert aligned[1]["error"] == 1500.0
    assert aligned[1]["intervalDurationHours"] == 0.5

def test_hourly_aggregated_alignment_averages_actuals():
    """
    In hourly_aggregated mode, the two half-hours (10000 and 10500) average to 10250 MW.
    Evaluating against 12000 MW forecast yields error = +1750 MW.
    """
    svc = ForecastService(cutoff_hour=11, cutoff_minute=0)
    forecasts = [
        {"startTime": "2026-01-02T10:00:00Z", "publishTime": "2026-01-01T09:30:00Z", "generation": 12000.0}
    ]
    actuals = [
        {"startTime": "2026-01-02T10:00:00Z", "settlementDate": "2026-01-02", "settlementPeriod": 21, "generation": 10000.0},
        {"startTime": "2026-01-02T10:30:00Z", "settlementDate": "2026-01-02", "settlementPeriod": 22, "generation": 10500.0},
    ]

    aligned = svc.align_forecast_and_actuals(actuals, forecasts, resolution="hourly_aggregated")

    assert len(aligned) == 1
    assert aligned[0]["actualGeneration"] == 10250.0
    assert aligned[0]["forecastGeneration"] == 12000.0
    assert aligned[0]["error"] == 1750.0
    assert aligned[0]["intervalDurationHours"] == 1.0

