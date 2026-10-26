import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = DATA_DIR / "cache"

# Ensure directories exist
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Elexon BMRS API Settings
ELEXON_BASE_URL = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "30"))

# Market Trading Decision Parameters
# In the UK Day-Ahead wholesale market (EPEX SPOT / Nord Pool), gate closure is normally 11:00 UTC on D-1.
# Some participants also reference 12:00 UTC. Default is set to 11:00 UTC on D-1.
DEFAULT_DAY_AHEAD_CUTOFF_HOUR = int(os.getenv("DEFAULT_DAY_AHEAD_CUTOFF_HOUR", "11"))
DEFAULT_DAY_AHEAD_CUTOFF_MINUTE = int(os.getenv("DEFAULT_DAY_AHEAD_CUTOFF_MINUTE", "0"))

# Target Evaluation Period
DEFAULT_START_DATE = os.getenv("DEFAULT_START_DATE", "2026-01-01")
DEFAULT_END_DATE = os.getenv("DEFAULT_END_DATE", "2026-01-31")

# Numerical stability threshold for MAPE
MAPE_MIN_ACTUAL_MW = float(os.getenv("MAPE_MIN_ACTUAL_MW", "100.0"))
