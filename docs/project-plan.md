# Project Plan: UK Day-Ahead Wind Generation & Forecast Analysis System

## 1. Project Overview
This project delivers a specialized analytics and decision-support web application for the power procurement team of a UK energy utility. 

### Core Business Context & Problem Setting
* **Market Operation**: The utility procures electricity from the wholesale UK Day-Ahead power market to satisfy downstream consumer demand. Power purchase commitments on day $D-1$ dictate how much conventional/thermal generation must be scheduled in addition to variable wind power.
* **The Trading Dilemma**: Wind generation is weather-dependent and intermittent. Day-ahead market auctions (e.g. EPEX SPOT / Nord Pool UK) close at mid-day (11:00 / 12:00 UTC) on $D-1$ for physical delivery on day $D$ (across 48 half-hour settlement periods). Power purchasers must make multi-million pound financial commitments based on the latest available wind forecasts at gate closure.
* **Dual Mission of the Application**:
  1. **Forecast Transparency**: Enable power traders to clearly inspect the latest available wind generation forecasts at the time trading decisions must be executed.
  2. **Quantitative Error Evaluation**: Rigorously evaluate forecast performance historically (using January 2026 Elexon data) across MAE, RMSE, WMAPE, forecast bias (over/under-prediction), and confidence intervals so that purchase volume decisions incorporate quantified risk.

### Data Sources (Elexon BMRS)
* **Actual Wind Generation (`FUELHH`)**: National outturn generation by fuel type. Filtered for `fuelType == "WIND"`. Half-hour settlement resolution (`startTime`, `generation` in MW).
* **Forecasted Wind Generation (`WINDFOR`)**: National wind forecast runs published by National Grid ESO. Contains target delivery interval (`startTime`), forecast generation (`generation` in MW), and publication timestamp (`publishTime`).
* **Day-Ahead Alignment Logic**: For any target delivery day $D$, the operational forecast available to traders is defined as the latest forecast published prior to the day-ahead auction cutoff on $D-1$ (defaulting to 11:00 UTC D-1, with configurable cutoff simulation).

---

## 2. Workspace Summary
* **Initial State**: Empty directory (`c:\Users\vamsh\Desktop\WellFound Assignment`).
* **Git Status**: Git initialized on branch `main`; configured remote `origin` -> `https://github.com/VamshiMudiraj05/q7m2x9kp.git`.
* **Runtimes & Tooling Available**:
  * Python: `3.14.6`
  * Node.js: `v24.18.0` / npm: `11.16.0`
  * Git: Installed with Credential Manager (`user.name=VamshiMudiraj05`, `user.email=vmudiraj330@gmail.com`).
  * Docker: Currently not present in system PATH on host; Dockerfile and docker-compose configurations will be provided for containerized deployment and evaluation.

---

## 3. Proposed Project Directory Structure

```
├── .gitignore
├── README.md
├── docker-compose.yml
├── docs/
│   └── project-plan.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                     # FastAPI entrypoint
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py               # Application settings
│   │   ├── core/
│   │   │   └── data_fetcher.py     # Elexon BMRS client (FUELHH & WINDFOR)
│   │   ├── services/
│   │   │   ├── forecast_service.py # D-1 cutoff forecast matcher & alignment
│   │   │   ├── metrics_service.py  # MAE, RMSE, WMAPE, Bias, P10/P90 calculations
│   │   │   └── cache_service.py    # Local caching layer (Parquet / SQLite)
│   │   ├── routers/
│   │   │   ├── forecasts.py        # /api/forecasts endpoints
│   │   │   ├── actuals.py          # /api/actuals endpoints
│   │   │   └── metrics.py          # /api/metrics endpoints
│   │   └── tests/
│   │       ├── test_fetcher.py
│   │       ├── test_forecast_matcher.py
│   │       └── test_metrics.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── index.css               # Styling system adapted from reference UI
    │   ├── components/
    │   │   ├── Navbar.jsx          # Glassmorphism top bar & navigation
    │   │   ├── ThemeToggle.jsx     # Dark / Light mode toggle
    │   │   ├── KPIOverview.jsx     # Executive summary stat cards
    │   │   ├── ForecastChart.jsx   # Time-series Recharts: Actual vs Forecast + P10/P90
    │   │   ├── ErrorAnalysis.jsx   # Bias, MAE, settlement period error breakdown
    │   │   ├── GateTimeFilter.jsx  # Day-Ahead cutoff simulator (e.g. 11:00 UTC D-1)
    │   │   └── DaySelector.jsx     # Date picker & range selector for Jan 2026
    │   └── services/
    │       └── api.js              # Axios / Fetch client for backend API
```

---

## 4. Proposed Frontend & Backend Organization

### Backend (Python / FastAPI)
* **Framework**: FastAPI for high-performance async REST APIs, automatic OpenAPI documentation, and typed validation (Pydantic v2).
* **Data Processing**: Pandas & NumPy for high-throughput time-series alignment, interpolation checks, settlement period (1–48) grouping, and statistical metrics.
* **Storage & Caching**: Pre-cached historical Elexon data for January 2026 stored in local Parquet / SQLite cache to ensure ultra-fast, sub-50ms API response times without external rate-limit dependencies. Live fallback fetching from Elexon BMRS API streams is retained.

### Frontend (React / Vite)
* **Framework**: React 19 + Vite for instantaneous hot-reloading and lightweight builds.
* **Styling**: Tailwind CSS with custom dark mode theming and glassmorphic micro-interactions derived from the reference project.
* **Visualization**: Interactive charts using Recharts for zoomable time-series, actual vs. forecast overlays, confidence ribbons, error histograms, and settlement-period heatmaps.

---

## 5. UI Reference (`vamshionweb`) Inspection & Reuse Plan

### Components & Styling Conventions Identified for Reuse
1. **Design Tokens & Theme System**:
   * Dark mode token hierarchy (`#0b0b0d` dark background, `#fffefd` light background, `#ededed` high-contrast text).
   * Rose/Blush accent colors (`#c2185b`, `#f3b9c8`) repurposed as visual accents for forecast variance and market alerts.
   * Background patterns: `.bg-project-grid` (48px subtle grid lines) providing a modern Bloomberg/trading terminal aesthetic.
   * Radial blur lighting: `.bg-radial-blush` for subtle ambient glow.
2. **Interactive UI Elements**:
   * `ThemeToggle.jsx`: Smooth animated light/dark toggle using Lucide icons (`Sun`, `Moon`) and Spring physics (`motion`).
   * Floating Pill Navigation (`Navbar.jsx`): Glassmorphic backdrop blur container (`bg-white/70 dark:bg-[#111111]/70 backdrop-blur-md rounded-full`) with active tab indicators.
   * Button & Card Micro-Interactions: `.dashed-border-anim`, `.glare-button`, `.glare-auto`, and custom scrollbars.
3. **What Will NOT Be Reused**:
   * Personal portfolio content, personal identifiers, contact form emailjs integration, and resume/blog data.

### Compatibility Analysis
* `vamshionweb` uses Tailwind CSS v4 (`@import "tailwindcss";`, `@custom-variant dark`) and React 19.
* These conventions will be cleanly integrated into our assignment's frontend without legacy conflict. Recharts will be added for financial-grade data charting.

---

## 6. Development Phases & 16-Hour Budget Allocation

| Phase | Description | Budget | Target Deliverable |
| :--- | :--- | :---: | :--- |
| **Phase 0** | Project Initialization, Git setup, planning & reference inspection | **1.0 h** | Initial commit, project plan, repo sync |
| **Phase 1** | Data Pipeline & Backend Core (Elexon client, Jan 2026 ingestion, cache) | **3.0 h** | Cleaned datasets, settlement period alignment |
| **Phase 2** | Day-Ahead Forecast Engine & Statistical Error Metrics | **3.0 h** | D-1 cutoff logic, MAE, RMSE, WMAPE, Bias APIs |
| **Phase 3** | Frontend Foundation & Theme Setup (Tailwind, Navbar, ThemeToggle) | **2.5 h** | Shell UI, theme system, layout components |
| **Phase 4** | Interactive Trading Dashboard & Data Visualizations | **3.5 h** | Time-series charts, error ribbons, settlement analysis |
| **Phase 5** | Containerization, Testing & Deployment | **1.5 h** | Docker compose, automated tests, cloud deploy |
| **Phase 6** | Documentation, README, Video Demo Script & Final Polish | **1.5 h** | Comprehensive README, 10-min demo video guide |
| **Total** | | **16.0 h** | Complete functional assignment submission |

---

## 7. Risks, Dependencies & Mitigations

1. **Elexon API Rate Limits / Latency**:
   * *Risk*: Live API calls during evaluation or demo could experience timeouts or network hiccups.
   * *Mitigation*: Implement an offline-first caching layer where January 2026 datasets are ingested, validated, and stored locally in Parquet/SQLite format upon startup.
2. **Day-Ahead Gate Time Ambiguity**:
   * *Risk*: Users or evaluators might expect different day-ahead cutoff times (e.g., 11:00 UTC vs 12:00 UTC or custom gates).
   * *Mitigation*: Provide an interactive "Day-Ahead Gate Time" parameter in the API and UI (allowing users to simulate forecast state at 09:00, 11:00, 12:00, or 17:00 UTC on $D-1$).
3. **Host Docker Engine**:
   * *Risk*: Docker engine is not in host PATH in current local environment.
   * *Mitigation*: Develop and test natively using Python and Node dev servers while maintaining standard Dockerfile and docker-compose.yml files for cloud deployment and evaluator verification.

---

## 8. Git Workflow & Target Repository
* **Target Repository**: `https://github.com/VamshiMudiraj05/q7m2x9kp.git`
* **Branching Strategy**: Single `main` branch with atomic, descriptive commits following Conventional Commits (`chore:`, `feat:`, `fix:`, `docs:`, `test:`).
* **Reference Repository Isolation**: `https://github.com/VamshiMudiraj05/vamshionweb` is strictly read-only and will never be modified or committed to.
