/**
 * Centralized API service for communicating with the Python FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, params = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errData = null;
      try {
        errData = await response.json();
      } catch {
        // Response was not JSON
      }
      throw new ApiError(
        errData?.detail || `API request failed with status ${response.status}`,
        response.status,
        errData
      );
    }

    return await response.json();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(`Network error connecting to backend: ${err.message}`, 0, null);
  }
}

export async function getHealth() {
  return request('/api/health');
}

export async function getActuals(startDate, endDate, refresh = false) {
  return request('/api/actuals', { start_date: startDate, end_date: endDate, refresh });
}

export async function getDayAheadForecasts(startDate, endDate, cutoffHour = 11, cutoffMinute = 0) {
  return request('/api/forecasts/day-ahead', {
    start_date: startDate,
    end_date: endDate,
    cutoff_hour: cutoffHour,
    cutoff_minute: cutoffMinute,
  });
}

export async function getAccuracyMetrics(startDate, endDate, cutoffHour = 11, cutoffMinute = 0, mapeThreshold = 100) {
  return request('/api/metrics/accuracy', {
    start_date: startDate,
    end_date: endDate,
    cutoff_hour: cutoffHour,
    cutoff_minute: cutoffMinute,
    mape_threshold: mapeThreshold,
  });
}

export async function getSettlementPeriods(startDate, endDate, cutoffHour = 11, cutoffMinute = 0) {
  return request('/api/metrics/settlement-periods', {
    start_date: startDate,
    end_date: endDate,
    cutoff_hour: cutoffHour,
    cutoff_minute: cutoffMinute,
  });
}

export async function getDailyScorecard(startDate, endDate, cutoffHour = 11, cutoffMinute = 0) {
  return request('/api/metrics/daily', {
    start_date: startDate,
    end_date: endDate,
    cutoff_hour: cutoffHour,
    cutoff_minute: cutoffMinute,
  });
}

export async function getAlignedSeries(startDate, endDate, cutoffHour = 11, cutoffMinute = 0) {
  return request('/api/metrics/aligned-series', {
    start_date: startDate,
    end_date: endDate,
    cutoff_hour: cutoffHour,
    cutoff_minute: cutoffMinute,
  });
}

export async function getLeadTimeDecay(startDate, endDate, cutoffHour = 11, cutoffMinute = 0) {
  return request('/api/metrics/lead-time-decay', {
    start_date: startDate,
    end_date: endDate,
    cutoff_hour: cutoffHour,
    cutoff_minute: cutoffMinute,
  });
}

export function getExportCsvUrl(startDate, endDate, cutoffHour = 11, cutoffMinute = 0) {
  const url = new URL(`${API_BASE_URL}/api/metrics/export-csv`, window.location.origin);
  if (startDate) url.searchParams.append('start_date', startDate);
  if (endDate) url.searchParams.append('end_date', endDate);
  url.searchParams.append('cutoff_hour', cutoffHour);
  url.searchParams.append('cutoff_minute', cutoffMinute);
  return url.toString();
}

export const api = {
  getHealth,
  getActuals,
  getDayAheadForecasts,
  getAccuracyMetrics,
  getSettlementPeriods,
  getDailyScorecard,
  getAlignedSeries,
  getLeadTimeDecay,
  getExportCsvUrl,
};

export default api;


