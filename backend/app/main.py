import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, actuals, forecasts, metrics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="UK Day-Ahead Wind Generation & Forecast Analysis API",
    description=(
        "Backend API supporting day-ahead wholesale electricity procurement for a UK utility. "
        "Integrates Elexon BMRS FUELHH (Wind Actuals) and WINDFOR (Forecasts) for January 2026, "
        "enforcing D-1 decision gate closures and quantitative accuracy evaluation (MAE, RMSE, Bias, WMAPE)."
    ),
    version="1.0.0"
)

# Enable CORS for React/Vite development server and production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(actuals.router)
app.include_router(forecasts.router)
app.include_router(metrics.router)

@app.get("/")
def root():
    return {
        "message": "UK Day-Ahead Wind Forecast Evaluation API is running.",
        "docsUrl": "/docs",
        "healthUrl": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
