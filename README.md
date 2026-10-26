# GridWind UK | Day-Ahead Wind Generation Forecast & Procurement Analytics

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React_19_Vite_7-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Deployment-Docker_Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![Tests](https://img.shields.io/badge/Tests-30_Passed-success.svg)]()

A customized decision-support and quantitative evaluation portal built for the **Day-Ahead Power Procurement Team** of a UK electricity utility. It interfaces with National Grid ESO / Elexon BMRS datasets to evaluate wind generation forecasts available at day-ahead gate closure, enabling traders to quantify thermal balancing requirements and imbalance risks for **January 2026**.

---

## 1. Executive Summary & Business Context

In the UK wholesale electricity market:
* Utilities purchase power in the Day-Ahead Market (EPEX SPOT / Nord Pool auctions) to meet downstream consumer demand.
* Auctions close at **11:00 / 12:00 UTC on day $D-1$** for physical delivery across 48 half-hour settlement periods on day $D$.
* Because wind is weather-dependent, power purchasers must determine how much thermal or flexible generation to buy based on the **latest wind forecast available prior to gate closure on $D-1$**.
* Inaccurate forecasts expose the utility to severe cash-out imbalance penalties in the Balancing Mechanism.

This portal provides:
1. **Forecast Transparency**: Clear visualization of the exact forecast available when bids are submitted, eliminating lookahead bias.
2. **Quantitative Error Evaluation**: Rigorous calculation of MAE, RMSE, Forecast Bias, WMAPE, and confidence envelopes ($P_{10}$ to $P_{90}$) across all of January 2026.
3. **Imbalance Risk & Hedging Simulator**: Real-time financial calculator simulating utility portfolio exposure under UK Balancing Mechanism System Buy Prices (cash-out penalties).
4. **Settlement Error Heatmap Matrix**: 31-day $\times$ 24-hour visual grid of all 744 settlement intervals colored by error severity.
5. **Forecast Horizon & Lead-Time Decay Analytics**: Quantitative evaluation of error degradation as lead time expands away from auction gate closure.
6. **One-Click Quant Export**: Downloadable RFC 4180 CSV for quantitative analysts and risk desks.

---

## 2. Directory Structure

```
├── .gitignore                      # Git exclusion rules
├── docker-compose.yml              # Multi-container orchestration (Backend + Frontend)
├── start.bat                       # One-click Windows startup script
├── start.sh                        # One-click Unix/macOS startup script
├── docs/
│   ├── project-plan.md             # Initial project planning, budget & UI reuse strategy
│   └── backend-api.md              # Complete REST API specification & mathematical formulas
├── backend/
│   ├── Dockerfile                  # Production Python 3.11 container with healthchecks
│   ├── .dockerignore
│   ├── requirements.txt            # Python dependencies (FastAPI, Uvicorn, Requests, Pytest)
│   ├── app/
│   │   ├── config.py               # Application configuration and market parameters
│   │   ├── main.py                 # FastAPI application with CORS and router registration
│   │   ├── core/
│   │   │   └── data_fetcher.py     # Elexon BMRS client with streaming and retry logic
│   │   ├── services/
│   │   │   ├── cache_service.py    # Local caching layer for sub-50ms query response
│   │   │   ├── forecast_service.py # D-1 decision cutoff logic & actuals alignment
│   │   │   └── metrics_service.py  # MAE, RMSE, Bias, WMAPE, decay & CSV export engine
│   │   └── routers/
│   │       ├── health.py           # GET /api/health
│   │       ├── actuals.py          # GET /api/actuals
│   │       ├── forecasts.py        # GET /api/forecasts/day-ahead
│   │       └── metrics.py          # GET /api/metrics (accuracy, settlement, daily, aligned, decay, export-csv)
│   ├── data/cache/                 # Pre-cached Elexon data for January 2026
│   └── tests/                      # Automated pytest test suites (24 tests passed)
└── frontend/
    ├── Dockerfile                  # Multi-stage build with Node 22 and Nginx reverse proxy
    ├── .dockerignore
    ├── nginx.conf                  # Nginx configuration routing /api/ to backend
    ├── package.json                # React 19, Tailwind CSS v4, Lucide, Motion, Recharts
    ├── vite.config.js              # Vite configuration with API proxy
    ├── index.html                  # HTML entrypoint with Instrument Serif & Inter fonts
    ├── test/                       # Automated frontend test suite (6 tests passed)
    └── src/
        ├── main.jsx
        ├── App.jsx                 # Dashboard coordinator (theme, filters, tabs, export)
        ├── index.css               # Design system & reference typography utilities
        ├── services/
        │   └── api.js              # Centralized backend API client
        └── components/
            ├── Navbar.jsx          # Header with branding, status badge, CSV export & theme toggle
            ├── KPIOverview.jsx     # Executive cards (MAE, RMSE, Bias, WMAPE, P10/P90)
            ├── ExecutiveBriefing.jsx # Quant Trading Desk Intelligence Card
            ├── ProcurementSimulator.jsx # Portfolio imbalance cash-out & hedging calculator
            ├── SettlementHeatmap.jsx     # 31-day x 24-hour settlement error matrix
            ├── LeadTimeChart.jsx        # Forecast horizon decay curve (MAE vs lead time)
            ├── ForecastChart.jsx        # Interactive Recharts time-series with rich tooltips
            ├── FilterControls.jsx       # Presets, custom date picker & D-1 gate cutoff selector
            ├── SettlementPeriodChart.jsx # Diurnal 24-hour error profile
            ├── DailyScorecardTable.jsx   # Sortable 31-day January 2026 scorecard
            ├── MethodologyPanel.jsx      # Transparent domain & mathematical definitions
            ├── ThemeToggle.jsx          # Light / Dark mode spring toggle
            └── StatusStates.jsx         # Loading, empty, and error retry states
```

---

## 3. How to Run Locally

### Option A: One-Click Startup (Recommended)
* **Windows**: Double-click or run `start.bat` in the project root:
  ```cmd
  .\start.bat
  ```
* **macOS / Linux**:
  ```bash
  chmod +x start.sh
  ./start.sh
  ```

### Option B: Manual Two-Terminal Setup
1. **Start the Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   * Backend Swagger docs: `http://127.0.0.1:8000/docs`
   * Health endpoint: `http://127.0.0.1:8000/api/health`

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   * Open: `http://localhost:5173`

---

## 4. How to Run with Docker

To run both services containerized on an isolated bridge network:

```bash
# Build and start all services in the background
docker compose up --build -d

# View container logs
docker compose logs -f

# Verify service health
docker compose ps

# Stop containers
docker compose down
```

* **Frontend Dashboard**: `http://localhost:3000` (or `http://localhost:5173`)
* **Backend API**: `http://localhost:8000`

---

## 5. Deployment Guide (Vercel & Render / Heroku)

### Recommended Cloud Architecture
* **Frontend**: Deploy on **Vercel** or Netlify as a single-page application.
  * Root directory: `frontend`
  * Build command: `npm run build`
  * Output directory: `dist`
  * Environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com`
* **Backend**: Deploy on **Render**, **Railway**, or **Heroku** as a Python web service.
  * Root directory: `backend`
  * Build command: `pip install -r requirements.txt`
  * Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  * Health check path: `/api/health`

---

## 6. Mathematical Evaluation Metrics

| Metric | Formula | Interpretation & Trading Impact |
| :--- | :--- | :--- |
| **MAE** | $\frac{1}{N} \sum \|F_i - A_i\|$ | Average hourly volume error in MW. Dictates expected thermal balancing top-up. |
| **RMSE** | $\sqrt{\frac{1}{N} \sum (F_i - A_i)^2}$ | Heavily penalizes large forecasting misses that trigger extreme cash-out prices. |
| **Bias** | $\frac{1}{N} \sum (F_i - A_i)$ | **Signed Mean Error**. Positive ($+$) = Over-forecasting (short imbalance risk). Negative ($-$) = Under-forecasting (excess spill risk). |
| **WMAPE** | $\frac{\sum \|F_i - A_i\|}{\sum A_i} \times 100\%$ | Normalized volume percentage error. Immune to division-by-zero during low wind. |
| **MAPE** | $\frac{1}{\|K\|} \sum_{i \in K} \frac{\|F_i - A_i\|}{A_i} \times 100\%$ | Evaluated over actuals $\ge 100$ MW to prevent mathematical explosion. |
| **Percentiles** | $P_{10}, P_{50}, P_{90}$ | Value-at-Risk confidence envelopes for trading desk hedging. |

---

## 7. Testing & Verification

Execute backend unit and integration test suites:
```bash
python -m pytest backend/tests -v
```
**Results**: 24 passed in 0.9s (covers mock API errors, D-1 gate selection without lookahead, duplicate resolution, edge cases, lead-time horizon decay, CSV generation, and API contracts).

Execute frontend test suite:
```bash
cd frontend && npm test
```
**Results**: 6 passed in 94ms (covers data formatting, bias risk classification, gate cutoff validation, January 2026 bounds, lead time calculations, and procurement risk hedging).

Verify frontend production build:
```bash
cd frontend && npm run build
```
**Results**: Bundled cleanly in 1.04s.

---

## 8. AI Tools Declaration

As permitted and requested by the assignment specification:
* **AI Tooling Used**: Antigravity AI Assistant (Google DeepMind advanced agentic coding system powered by Gemini 3.8 Flash).
* **Scope of Assistance**: Assistance in architecture planning, Elexon BMRS endpoint inspection, implementation of mathematical error metrics, component layout, and Docker containerization. All data ingestion, decision cutoff logic, and calculations were independently verified against live Elexon datasets.
