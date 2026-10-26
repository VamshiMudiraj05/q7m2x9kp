# Backend API Documentation: UK Day-Ahead Wind Forecast Evaluation System

## 1. Overview
The backend service provides a robust, high-performance data processing and quantitative evaluation API for the power procurement desk of a UK energy utility. It interfaces with National Grid ESO / Elexon BMRS datasets to reconstruct the operational day-ahead information state for electricity traders and computes quantitative forecast accuracy metrics for **January 2026**.

---

## 2. Architecture & Responsibilities

```
backend/
├── app/
│   ├── config.py                 # Configuration settings, API URLs, defaults
│   ├── main.py                   # FastAPI application entrypoint with CORS
│   ├── core/
│   │   └── data_fetcher.py       # Elexon BMRS client with streaming, retry & timeout
│   ├── services/
│   │   ├── cache_service.py      # High-speed local cache for Elexon raw & normalized data
│   │   ├── forecast_service.py   # D-1 decision cutoff enforcement & actuals alignment
│   │   └── metrics_service.py    # MAE, RMSE, Bias, WMAPE, MAPE, percentiles engine
│   └── routers/
│       ├── health.py             # /api/health
│       ├── actuals.py            # /api/actuals
│       ├── forecasts.py          # /api/forecasts/day-ahead
│       └── metrics.py            # /api/metrics/accuracy, /settlement-periods, /daily, /aligned-series
├── data/
│   └── cache/                    # JSON cache for Jan 2026 actuals (1,489 items) & forecasts (19,272 items)
├── tests/                        # 20 automated unit and integration tests (100% pass)
└── requirements.txt
```

---

## 3. Data Sources & Integration

### 3.1 Actual Wind Generation (`FUELHH`)
* **Endpoint**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`
* **Filter**: `fuelType == "WIND"`
* **Resolution**: 30-minute intervals corresponding to UK Settlement Periods 1 to 48 (or 50 on clock-change days).
* **Observed Volume**: 1,489 half-hour settlement records across January 2026.
* **Fields**:
  * `startTime`: Settlement interval start in ISO 8601 UTC (e.g., `2026-01-01T00:00:00Z`).
  * `settlementDate`: UK calendar delivery date (`YYYY-MM-DD`).
  * `settlementPeriod`: 1 to 48.
  * `generation`: National wind power generation in MW.

### 3.2 Wind Generation Forecasts (`WINDFOR`)
* **Endpoint**: `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`
* **Resolution**: 1-hour intervals (`:00:00Z`).
* **Publication Frequency**: Published approximately every 3 hours (~8 runs per day), each run providing a 48 to 72 hour forward-looking horizon.
* **Observed Volume**: 19,272 forecast records published between 2025-12-30 and 2026-02-01.
* **Fields**:
  * `startTime`: Target delivery hour in ISO 8601 UTC.
  * `publishTime`: Timestamp when National Grid ESO released the forecast run.
  * `generation`: Forecasted national wind power in MW.

---

## 4. Key Data Decisions & Assumptions

### 4.1 Day-Ahead Decision Gate Closure (D-1 Cutoff)
In wholesale electricity trading (EPEX SPOT / Nord Pool UK Day-Ahead Auctions), bids must be finalized **one day before physical delivery ($D-1$)**. 
* **Auction Gate Time**: Default is set to **11:00 UTC on $D-1$** (configurable via API query parameter `cutoff_hour`).
* **Selection Rule**: For any target delivery interval on day $D$, only forecasts published $\le (D-1 \text{ at } 11:00\text{ UTC})$ are eligible. Among eligible candidates, the one with the latest `publishTime` is selected.
* **No Lookahead Bias**: Forecasts published after 11:00 UTC on $D-1$ or intraday on day $D$ are strictly excluded from the day-ahead baseline, as they represent information that was unavailable to the buyer at auction commitment time.

### 4.2 Temporal Resolution Alignment
* `WINDFOR` forecasts are published at hourly intervals (`:00:00Z`), whereas `FUELHH` actuals are half-hourly (`:00:00Z` and `:30:00Z`).
* The system pairs each hourly forecast directly with the corresponding hourly settlement interval start (`:00:00Z`), providing 744 matched evaluation points for January 2026 (24 hours $\times$ 31 days).

---

## 5. Quantitative Accuracy Metrics Engine

### 5.1 Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |F_i - A_i| \quad (\text{MW})$$
* **Interpretation**: The average volume (in MW) by which the forecast deviates from outturn generation. Directly translates to the average thermal/flexible balancing volume needed.

### 5.2 Root Mean Square Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (F_i - A_i)^2} \quad (\text{MW})$$
* **Interpretation**: Heavily penalizes large forecasting misses. Critical for utilities because large unexpected swings trigger extreme cash-out prices in the Balancing Mechanism.

### 5.3 Forecast Bias (Mean Forecast Error)
$$\text{Bias} = \frac{1}{N} \sum_{i=1}^N (F_i - A_i) \quad (\text{MW})$$
* **Sign Convention**:
  * $\text{Bias} > 0$ (**Over-forecasting**): Forecast exceeds actual generation. The utility under-procures thermal power at day-ahead, leading to system short-imbalance penalties.
  * $\text{Bias} < 0$ (**Under-forecasting**): Forecast is below actual generation. The utility over-procures thermal power, leading to excess spill power sold at depressed prices.

### 5.4 WMAPE (Weighted Mean Absolute Percentage Error)
$$\text{WMAPE} = \frac{\sum_{i=1}^N |F_i - A_i|}{\sum_{i=1}^N A_i} \times 100\%$$
* **Interpretation**: Normalized percentage error relative to total monthly energy volume. Unlike standard MAPE, WMAPE is mathematically immune to division-by-zero during low-wind periods.

### 5.5 MAPE with Near-Zero Protection
$$\text{MAPE} = \frac{1}{|K|} \sum_{i \in K} \frac{|F_i - A_i|}{A_i} \times 100\% \quad \text{where } K = \{i \mid A_i \ge 100\text{ MW}\}$$
* **Threshold**: Observations with $A_i < 100\text{ MW}$ are excluded to prevent explosive percentage artifacts, and the count of excluded points (`mapeExcludedCount`) is explicitly reported.

### 5.6 Error Percentiles
* $P_{10}, P_{25}, P_{50} (\text{Median}), P_{75}, P_{90}$ calculated via linear interpolation to give risk traders confidence bounds.

---

## 6. API Reference

### Base URL: `http://localhost:8000`

### 6.1 `GET /api/health`
Health check and cache status.
* **Response**:
```json
{
  "status": "healthy",
  "service": "UK Day-Ahead Wind Forecast Evaluation API",
  "version": "1.0.0",
  "targetEvaluationMonth": "January 2026",
  "cache": {
    "actualsCached": true,
    "forecastsCached": true
  }
}
```

### 6.2 `GET /api/actuals`
Retrieve validated outturn wind generation.
* **Query Parameters**:
  * `start_date` (string, optional): `YYYY-MM-DD` (default `2026-01-01`)
  * `end_date` (string, optional): `YYYY-MM-DD` (default `2026-01-31`)
  * `refresh` (boolean, optional): Force re-fetch from Elexon API.
* **Sample Response Item**:
```json
{
  "startTime": "2026-01-01T00:00:00Z",
  "settlementDate": "2026-01-01",
  "settlementPeriod": 1,
  "fuelType": "WIND",
  "generation": 14210
}
```

### 6.3 `GET /api/forecasts/day-ahead`
Retrieve operational Day-Ahead forecast subject to D-1 cutoff.
* **Query Parameters**:
  * `start_date` (string, optional): `YYYY-MM-DD`
  * `end_date` (string, optional): `YYYY-MM-DD`
  * `cutoff_hour` (int, optional): `0-23` (default `11`)
  * `cutoff_minute` (int, optional): `0-59` (default `0`)
* **Sample Response Item**:
```json
{
  "startTime": "2026-01-01T00:00:00Z",
  "targetDate": "2026-01-01",
  "forecastGeneration": 19466.0,
  "publishTime": "2025-12-31T09:30:00Z",
  "decisionCutoffTime": "2025-12-31T11:00:00Z",
  "leadTimeHours": 14.5
}
```

### 6.4 `GET /api/metrics/accuracy`
Summary quantitative error metrics for trading decisions.
* **Query Parameters**: `start_date`, `end_date`, `cutoff_hour`, `cutoff_minute`, `mape_threshold`.
* **Sample Response**:
```json
{
  "evaluationPeriod": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "dayAheadGate": "11:00 UTC on D-1"
  },
  "metrics": {
    "observationCount": 744,
    "mae": 1948.32,
    "rmse": 2486.15,
    "bias": 1120.45,
    "wmape": 15.82,
    "mape": 17.64,
    "mapeThresholdMW": 100.0,
    "mapeExcludedCount": 4,
    "totalActualGenerationMW": 9154200.0,
    "totalForecastGenerationMW": 9987815.0,
    "maxAbsoluteErrorMW": 7820.0,
    "errorPercentiles": {
      "p10": -1250.0,
      "p25": -340.0,
      "p50_median": 850.0,
      "p75": 2180.0,
      "p90": 4120.0
    },
    "units": {
      "mae": "MW",
      "rmse": "MW",
      "bias": "MW (Positive = Over-forecast, Negative = Under-forecast)",
      "wmape": "% of total volume",
      "mape": "% (filtered for actuals >= threshold)"
    },
    "status": "VALID"
  }
}
```

### 6.5 `GET /api/metrics/settlement-periods`
Intraday error profiles across the 24 hours of the delivery day.

### 6.6 `GET /api/metrics/daily`
Day-by-day error scorecard across January 2026.

### 6.7 `GET /api/metrics/aligned-series`
Paired `(startTime, actualGeneration, forecastGeneration, error)` time series for charting.

---

## 7. Running & Testing Locally

### Start Backend Dev Server
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Execute Test Suite
```bash
python -m pytest backend/tests -v
```
**Results**: 20 passed in 1.30s.
