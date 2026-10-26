import pytest
import math
from app.services.metrics_service import MetricsService, calculate_percentile

def test_calculate_summary_metrics_exact_values():
    """
    Test accuracy calculations against hand-computed values:
    Actuals: [1000, 2000, 3000, 4000]
    Forecasts: [1200, 1900, 3300, 3800]
    Errors: [+200, -100, +300, -200]
    Abs Errors: [200, 100, 300, 200] -> Sum = 800 -> MAE = 200.0 MW
    Sq Errors: [40000, 10000, 90000, 40000] -> Sum = 180000 -> Mean = 45000 -> RMSE = sqrt(45000) = 212.13 MW
    Bias: (200 - 100 + 300 - 200) / 4 = +200 / 4 = +50.0 MW
    Tot Actual: 10000 MW
    WMAPE: 800 / 10000 * 100 = 8.0 %
    MAPE: ((200/1000) + (100/2000) + (300/3000) + (200/4000)) / 4 * 100
        = (0.2 + 0.05 + 0.1 + 0.05) / 4 * 100 = 0.40 / 4 * 100 = 10.0 %
    """
    sample_data = [
        {"actualGeneration": 1000.0, "forecastGeneration": 1200.0, "error": 200.0, "absoluteError": 200.0, "squaredError": 40000.0},
        {"actualGeneration": 2000.0, "forecastGeneration": 1900.0, "error": -100.0, "absoluteError": 100.0, "squaredError": 10000.0},
        {"actualGeneration": 3000.0, "forecastGeneration": 3300.0, "error": 300.0, "absoluteError": 300.0, "squaredError": 90000.0},
        {"actualGeneration": 4000.0, "forecastGeneration": 3800.0, "error": -200.0, "absoluteError": 200.0, "squaredError": 40000.0},
    ]

    result = MetricsService.calculate_summary_metrics(sample_data, mape_threshold=100.0)

    assert result["observationCount"] == 4
    assert result["mae"] == 200.0
    assert result["rmse"] == round(math.sqrt(45000), 2)
    assert result["bias"] == 50.0
    assert result["wmape"] == 8.0
    assert result["mape"] == 10.0
    assert result["mapeExcludedCount"] == 0
    assert result["maxAbsoluteErrorMW"] == 300.0

def test_mape_handles_zero_and_near_zero_actuals_safely():
    """
    Verify that zero or near-zero generation actuals do not cause DivisionByZero errors.
    Observations below threshold are excluded from standard MAPE and counted in mapeExcludedCount.
    WMAPE remains stable and well-defined across all volume.
    """
    sample_data = [
        # Near zero: 0 MW and 10 MW (both < 100 MW threshold)
        {"actualGeneration": 0.0, "forecastGeneration": 150.0, "error": 150.0, "absoluteError": 150.0, "squaredError": 22500.0},
        {"actualGeneration": 10.0, "forecastGeneration": 200.0, "error": 190.0, "absoluteError": 190.0, "squaredError": 36100.0},
        # Valid generation >= 100 MW
        {"actualGeneration": 1000.0, "forecastGeneration": 1100.0, "error": 100.0, "absoluteError": 100.0, "squaredError": 10000.0},
    ]

    result = MetricsService.calculate_summary_metrics(sample_data, mape_threshold=100.0)

    assert result["observationCount"] == 3
    assert result["mapeExcludedCount"] == 2
    # Only observation 3 (1000 MW) is used for MAPE: (100 / 1000) * 100 = 10.0%
    assert result["mape"] == 10.0
    # WMAPE: Total Abs Error = 150 + 190 + 100 = 440 MW; Total Actual = 1010 MW -> 440 / 1010 * 100 = 43.56%
    assert result["wmape"] == round(440 / 1010 * 100, 2)

def test_percentile_calculation():
    """Verify linear interpolation percentile helper."""
    values = [-100, -50, 0, 50, 100]
    assert calculate_percentile(values, 0) == -100.0
    assert calculate_percentile(values, 50) == 0.0
    assert calculate_percentile(values, 100) == 100.0

def test_empty_dataset_returns_no_data():
    """Verify clean response when no observations match."""
    result = MetricsService.calculate_summary_metrics([])
    assert result["status"] == "NO_DATA"
    assert result["observationCount"] == 0
    assert result["mae"] is None
