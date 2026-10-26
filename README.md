# GridWind UK | Day-Ahead Wind Forecast & Wholesale Procurement Benchmark

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React_19_Vite_8-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Deployment-Docker_Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![Render Live API](https://img.shields.io/badge/Render-Live_API-46E3B7.svg?logo=render&logoColor=white)](https://gridbricks-fglz.onrender.com)
[![Tests Passing](https://img.shields.io/badge/Tests-38_Passed-success.svg)]()

> **Live Backend API**: [https://gridbricks-fglz.onrender.com](https://gridbricks-fglz.onrender.com)  
> **Interactive Swagger API Docs**: [https://gridbricks-fglz.onrender.com/docs](https://gridbricks-fglz.onrender.com/docs)  
> **API Health Check**: [https://gridbricks-fglz.onrender.com/api/health](https://gridbricks-fglz.onrender.com/api/health)

A production-grade quantitative decision-support portal built for the **Day-Ahead Power Procurement Desk** of a UK electricity utility. It interfaces directly with National Grid ESO and Elexon BMRS datasets to evaluate wind generation forecasts available at gate closure, enabling trading and risk desks to quantify thermal balancing requirements, cash-out error margins, and financial imbalance exposure across **January 2026**.

---

## 1. Executive Summary & Market Context

In the UK wholesale electricity market:
* **Day-Ahead Auction Commitments**: Utilities purchase bulk electricity in day-ahead auctions (e.g. EPEX SPOT and Nord Pool) to cover forecasted customer demand for the following delivery day ($D$).
* **Auction Gate Closure**: Commitments close strictly at **11:00 UTC on day $D-1$** for physical delivery across 48 half-hour settlement periods on day $D$.
* **Balancing Exposure**: Because wind generation is intermittent, power buyers must rely on the latest wind forecast available *prior* to gate closure to determine how much thermal or flexible generation to buy. 
* **The Balancing Mechanism (Cash-Out)**: Forecast errors translate directly into physical position shortfalls. Under the UK Balancing Mechanism, negative imbalances are settled at costly **System Buy Prices (SBP)**, exposing utilities to substantial financial penalties.

This portal provides wholesale traders with:
1. **Zero-Lookahead Forecast Transparency**: Strict enforcement of $D-1$ decision gate cutoffs without future data leakage.
2. **Defensible Metric Calculations**: Verified evaluations of MAE, RMSE, Forecast Bias, WMAPE, and confidence envelopes ($P_{10}$ to $P_{90}$) across all of January 2026.
3. **Dual Temporal Resolution**: Full support for both **Half-Hourly (1,488 BSC Settlement Periods)** and **Hourly Aggregated (744 Hours)** analysis.
4. **Imbalance Risk & Hedging Simulator**: Real-time financial calculator simulating utility portfolio exposure under UK Balancing Mechanism cash-out prices.
5. **31-Day Settlement Error Matrix**: Heatmap visualization identifying persistent morning ramp shortfalls and multi-day storm event anomalies.
6. **One-Click Quant Export**: RFC 4180 compliant CSV export for quantitative risk modeling.

---

## 2. Key Audit Findings & Methodology

### A. The 744 vs. 1,488 Observation Audit
* **Root Cause**: Elexon outturn actuals (`FUELHH`) are recorded half-hourly (1,488 records in January 2026), whereas National Grid wind forecasts (`WINDFOR`) are published hourly (`:00:00Z`, 744 points). Unaggregated matching previously discarded the `:30:00Z` actuals.
* **Resolution**: The platform supports **both** standard industry methodologies:
  1. **Half-Hourly BSC Settlement Mode (1,488 SPs, Default)**: The hourly MW forecast applies across both settlement periods ($2h+1$ and $2h+2$) in each hour, matching actual physical market settlement.
  2. **Hourly Aggregated Mode (744 Hours)**: Adjacent half-hourly actuals are averaged into 1-hour power blocks, matching hourly forecast publication blocks.

### B. Strict Gate Closure (No Lookahead Bias)
* Day-ahead forecast selection enforces $\text{publishTime} \le \text{cutoffDate} + \text{cutoffHour}$.
* For delivery day $D$, the default gate closure is **11:00:00 UTC on $D-1$** (13 to 37 hours ahead of physical delivery).
* **Deterministic Tie-Breaking**: When multiple forecasts share identical publication timestamps, deterministic tie-breaking by `startTime` and payload index ensures reproducible, auditable results.

### C. January 2026 Ground-Truth Evaluation Benchmark

Evaluated at the primary **11:00 UTC D-1 EPEX SPOT Gate Closure**:

| Evaluation Metric | Half-Hourly Resolution (1,488 SPs) | Hourly Aggregated (744 Hours) | Commercial Interpretation & Balancing Impact |
| :--- | :--- | :--- | :--- |
| **Observation Count** | **1,488 intervals** | **744 intervals** | Complete January 2026 temporal coverage (31 days). |
| **Mean Absolute Error (MAE)** | **2,126.12 MW** | **2,126.12 MW** | Average magnitude of forecast error per settlement interval. Dictates required standby thermal reserve. |
| **Root Mean Squared Error (RMSE)** | **2,620.80 MW** | **2,620.80 MW** | Penalizes severe forecast misses. Higher than MAE by **+494.7 MW**, proving volatility driven by surprise swings. |
| **Forecast Bias** | **+1,840.30 MW** | **+1,840.30 MW** | **Severe Over-Forecasting**. The forecast predicted ~1,840 MW *more* wind than actually generated. |
| **Volume Shortfall** | **1,369.18 GWh** | **1,369.18 GWh** | Total energy imbalance across January ($\text{Bias} \times 744\text{ h} / 1000$). Left utilities short on power. |
| **Weighted MAPE (WMAPE)** | **18.36%** | **18.36%** | Total error volume as a percentage of total actual generation. Immune to zero-division calm periods. |
| **Standard MAPE** | **22.13%** | **22.13%** | Evaluated with a 100 MW threshold to prevent division-by-zero artifacts during calm days. |
| **Maximum Absolute Error** | **6,857.00 MW** | **6,857.00 MW** | Single largest forecast miss occurred on **January 24, 2026** during storm ramp down. |

---

## 3. Architecture & Directory Structure

```
├── .gitignore                      # Git exclusion rules
├── docker-compose.yml              # Multi-container orchestration (Backend + Frontend)
├── render.yaml                     # Render Infrastructure as Code Blueprint
├── start.bat                       # One-click Windows startup script
├── start.sh                        # One-click Unix/macOS startup script
├── README.md                       # High-level architecture and audit documentation
├── backend/
│   ├── Dockerfile                  # Python container with healthcheck configuration
│   ├── requirements.txt            # FastAPI, Uvicorn, Requests, Pytest, AnyIO
│   ├── app/
│   │   ├── config.py               # Market parameters (default 11:00 UTC cutoff)
│   │   ├── main.py                 # FastAPI application with CORS and router registration
│   │   ├── core/
│   │   │   └── data_fetcher.py     # Elexon BMRS client with streaming and retry logic
│   │   ├── services/
│   │   │   ├── cache_service.py    # Local caching layer for sub-50ms query responses
│   │   │   ├── forecast_service.py # D-1 decision gate logic, tie-breaking & dual-resolution alignment
│   │   │   └── metrics_service.py  # MAE, RMSE, Bias, WMAPE, GWh volume & CSV export engine
│   │   └── routers/
│   │       ├── health.py           # GET /api/health
│   │       ├── actuals.py          # GET /api/actuals
│   │       ├── forecasts.py        # GET /api/forecasts/day-ahead
│   │       └── metrics.py          # GET /api/metrics (accuracy, settlement, daily, aligned, decay, export-csv)
│   ├── data/cache/                 # Pre-cached Elexon data for January 2026
│   └── tests/                      # Automated test suite (30 passed tests)
└── frontend/
    ├── Dockerfile                  # Multi-stage production container with Nginx
    ├── nginx.conf                  # Nginx reverse proxy configuration
    ├── package.json                # React 19, Tailwind CSS v4, Lucide, Recharts
    ├── vite.config.js              # Vite configuration with API proxy
    ├── index.html                  # HTML entrypoint with typography tokens
    ├── test/                       # Frontend unit test suite (8 passed tests)
    └── src/
        ├── main.jsx
        ├── App.jsx                 # Dashboard coordinator with dynamic tab headers and auto-scroll
        ├── index.css               # Design system & reference typography utilities
        ├── services/
        │   └── api.js              # Centralized backend API client
        └── components/
            ├── Navbar.jsx          # Header branding, tabs, live health check, and CSV export
            ├── KPIOverview.jsx     # 4 Core KPI cards with plain-English interactive popups
            ├── ProcurementSimulator.jsx # Portfolio cash-out exposure & hedging strategy simulator
            ├── SettlementHeatmap.jsx     # 31-day x 24-hour error intensity matrix
            ├── ForecastChart.jsx        # Interactive overlay line & volume area time-series
            ├── FilterControls.jsx       # Presets, custom date picker, gate cutoff & resolution toggle
            ├── SettlementPeriodChart.jsx # Diurnal 48-settlement-period error profile
            ├── LeadTimeChart.jsx        # Forecast horizon decay curve (MAE vs lead time)
            ├── DailyScorecardTable.jsx   # Sortable 31-day January 2026 scorecard
            ├── MethodologyPanel.jsx      # Regulatory documentation & mathematical formulas
            ├── ThemeToggle.jsx          # Light / Dark mode spring toggle
            └── StatusStates.jsx         # Loading, empty, and error retry states
```

---

## 4. How to Run Locally

### Option A: One-Click Startup (Recommended)
* **Windows**:
  ```cmd
  .\start.bat
  ```
* **macOS / Linux**:
  ```bash
  chmod +x start.sh
  ./start.sh
  ```

### Option B: Manual Two-Terminal Setup
1. **Backend (Python 3.10+)**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   * API Health Check: `http://127.0.0.1:8000/api/health`
   * Swagger Documentation: `http://127.0.0.1:8000/docs`

2. **Frontend (Node 20+)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   * Local Dashboard: `http://localhost:5173`

---

## 5. How to Run with Docker Compose

To run both services in containerized production mode on an isolated bridge network:

```bash
# Build and run containers in background
docker compose up --build -d

# Check service status and healthchecks
docker compose ps

# View unified logging stream
docker compose logs -f

# Teardown
docker compose down
```

* **Frontend Dashboard**: `http://localhost:3000` (or `http://localhost:5173`)
* **Backend API**: `http://localhost:8000`

---

## 6. Testing & Quality Assurance

The codebase includes comprehensive automated test suites across backend data pipelines, cutoff gate logic, metric calculation routines, and frontend data transformations.

### Backend Automated Test Suite
```bash
python -m pytest backend/tests -v
```
**Results: 30 Passed, 0 Failed (100% Passing)**
* `test_health_endpoint`, `test_actuals_endpoint`, `test_day_ahead_forecasts_endpoint`
* `test_accuracy_metrics_endpoint`, `test_settlement_periods_endpoint`, `test_daily_scorecard_endpoint`
* `test_aligned_series_endpoint`, `test_lead_time_decay_endpoint`, `test_export_csv_endpoint`
* `test_fetch_actual_generation_filters_wind_correctly`, `test_fetch_forecast_generation_validates_required_fields`
* `test_fetcher_handles_http_errors_gracefully`, `test_fetcher_handles_timeout_error`
* `test_parse_iso_utc_normalizes_timestamps`, `test_decision_cutoff_calculated_for_d_minus_1`
* `test_select_day_ahead_forecasts_enforces_gate_closure_without_lookahead`
* `test_duplicate_publish_timestamps_deterministic_tie_break`
* `test_cutoff_boundary_exact_second_enforcement`
* `test_half_hourly_alignment_maps_both_settlement_periods`
* `test_hourly_aggregated_alignment_averages_actuals`
* `test_calculate_summary_metrics_exact_values`, `test_mape_handles_zero_and_near_zero_actuals_safely`
* `test_percentile_calculation`, `test_empty_dataset_returns_no_data`, `test_calculate_lead_time_decay`
* `test_generate_aligned_csv`, `test_energy_imbalance_calculation_half_hourly`, `test_energy_imbalance_calculation_hourly_surplus`

### Frontend Automated Test Suite
```bash
cd frontend && npm test
```
**Results: 8 Passed, 0 Failed (100% Passing)**
* Formats numbers and handles null values gracefully
* Correctly classifies over-forecasting vs under-forecasting bias
* Validates Day-Ahead cutoff gate constraints
* Validates January 2026 date bounds
* Calculates lead time from `startTime` and `publishTime`
* Computes procurement imbalance and cash-out cost avoidance
* Validates delivery hours conversion from settlement observation count ($1,488 \times 0.5\text{ h} = 744\text{ h}$)
* Calculates energy imbalance volume in GWh consistently ($\text{MW} \times \text{Hours} / 1000$)

### Production Build Verification
```bash
cd frontend && npm run build
```
**Results: Built cleanly in under 1.2s** using Vite and Rollup.

---

## 7. REST API Endpoints Specification

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | — | System health, service status, and Elexon connectivity check. |
| `GET` | `/api/actuals` | `start_date`, `end_date` | National wind actuals from Elexon `FUELHH`. |
| `GET` | `/api/forecasts/day-ahead`| `start_date`, `end_date`, `cutoff_hour` | Latest eligible `WINDFOR` forecasts published prior to $D-1$ cutoff. |
| `GET` | `/api/metrics/accuracy` | `start_date`, `end_date`, `cutoff_hour`, `resolution` | Summary accuracy metrics (MAE, RMSE, Bias, WMAPE, MAPE, GWh volume). |
| `GET` | `/api/metrics/settlement-periods`| `start_date`, `end_date`, `cutoff_hour`, `resolution` | Intraday diurnal profile across settlement periods (1 to 48). |
| `GET` | `/api/metrics/daily` | `start_date`, `end_date`, `cutoff_hour`, `resolution` | Daily performance scorecard for all 31 days of January 2026. |
| `GET` | `/api/metrics/aligned-series` | `start_date`, `end_date`, `cutoff_hour`, `resolution` | Full aligned time-series of actuals vs forecasts with interval errors. |
| `GET` | `/api/metrics/lead-time-decay` | `start_date`, `end_date`, `cutoff_hour` | Forecast skill degradation as lead time expands (11h to 35h). |
| `GET` | `/api/metrics/export-csv` | `start_date`, `end_date`, `cutoff_hour`, `resolution` | RFC 4180 compliant CSV export for quantitative risk modeling. |

---

## 8. AI Tools Declaration

In accordance with the challenge guidelines:
* **Tooling Used**: Antigravity AI Assistant (Google DeepMind agentic coding system powered by Gemini 3.8 Flash).
* **Scope of Assistance**: Assistance in architecture planning, identifying the hourly vs half-hourly publication discrepancy in Elexon BMRS data, generating unit test fixtures, and optimizing Tailwind CSS v4 styling tokens.
* **Verification**: All mathematical formulas, gate closure cutoffs, lookahead protection rules, and financial cash-out calculations were verified with independent unit tests and cross-referenced against official Elexon BSC documentation.
