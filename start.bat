@echo off
echo ========================================================
echo Starting UK Day-Ahead Wind Forecast & Analytics System
echo ========================================================

echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "GridWind Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Frontend on http://localhost:5173 ...
start "GridWind Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching!
echo Backend API Docs: http://127.0.0.1:8000/docs
echo Frontend Dashboard: http://localhost:5173
echo ========================================================
