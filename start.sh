#!/bin/bash
echo "========================================================"
echo "Starting UK Day-Ahead Wind Forecast & Analytics System"
echo "========================================================"

echo "[1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ..."
(cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload) &
BACKEND_PID=$!

sleep 2

echo "[2/2] Starting React Frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Both servers are running!"
echo "Backend API Docs: http://127.0.0.1:8000/docs"
echo "Frontend Dashboard: http://localhost:5173"
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
