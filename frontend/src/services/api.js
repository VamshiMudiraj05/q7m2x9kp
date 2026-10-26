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

export const api = {
  getHealth: () => request('/api/health'),
  
  getActuals: (startDate, endDate, refresh = false) =>
    request('/api/actuals', { start_date: startDate, end_date: endDate, refresh }),

  getDayAheadForecasts: (startDate, endDate, cutoffHour = 11, cutoffMinute = 0) =>
    request('/api/forecasts/day-ahead', {
      start_date: startDate,
      end_date: endDate,
      cutoff_hour: cutoffHour,
      cutoff_minute: cutoffMinute,
    }),

  getAccuracyMetrics: (startDate, endDate, cutoffHour = 11, cutoffMinute = 0, mapeThreshold = 100) =>
    request('/api/metrics/accuracy', {
      start_date: startDate,
      end_date: endDate,
      cutoff_hour: cutoffHour,
      cutoff_minute: cutoffMinute,
      mape_threshold: mapeThreshold,
    }),

  getSettlementPeriods: (startDate, endDate, cutoffHour = 11, cutoffMinute = 0) =>
    request('/api/metrics/settlement-periods', {
      start_date: startDate,
      end_date: endDate,
      cutoff_hour: cutoffHour,
      cutoff_minute: cutoffMinute,
    }),

  getDailyScorecard: (startDate, endDate, cutoffHour = 11, cutoffMinute = 0) =>
    request('/api/metrics/daily', {
      start_date: startDate,
      end_date: endDate,
      cutoff_hour: cutoffHour,
      cutoff_minute: cutoffMinute,
    }),

  getAlignedSeries: (startDate, endDate, cutoffHour = 11, cutoffMinute = 0) =>
    request('/api/metrics/aligned-series', {
      start_date: startDate,
      end_date: endDate,
      cutoff_hour: cutoffHour,
      cutoff_minute: cutoffMinute,
    }),
};
