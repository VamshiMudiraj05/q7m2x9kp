import React from "react";
import { AlertTriangle, HelpCircle, Compass } from "lucide-react";

export default function KPIOverview({ metrics, loading }) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] animate-pulse border border-black/5 dark:border-white/5" />
        ))}
      </div>
    );
  }

  const {
    observationCount = 0,
    mae,
    rmse,
    bias,
    wmape,
    mape,
    mapeExcludedCount = 0,
    maxAbsoluteErrorMW = 0,
    errorPercentiles,
  } = metrics;

  const isOverForecasting = (bias ?? 0) > 0;

  return (
    <div className="space-y-4 mb-6">
      {/* 4 Core Quantitative Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MAE Card */}
        <div className="relative p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft dashed-border-anim group">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              Mean Absolute Error
            </span>
            <span title="Average magnitude of forecast error across all settlement intervals">
              <HelpCircle size={13} className="text-gray-400 group-hover:text-[#c2185b] transition-colors" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight font-instrument text-[#111111] dark:text-[#ffffff]">
              {mae != null ? Number(mae).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-sans">MW</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between font-sans">
            <span>Volume deviation</span>
            <span className="font-mono text-gray-700 dark:text-gray-300">
              Max: {maxAbsoluteErrorMW != null ? `${Number(maxAbsoluteErrorMW).toLocaleString()} MW` : '—'}
            </span>
          </div>
        </div>

        {/* RMSE Card */}
        <div className="relative p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft dashed-border-anim group">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 font-sans">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              Root Mean Squared Error
            </span>
            <span title="Penalizes large forecast misses heavily. Crucial for exposure to severe balancing cash-out spikes">
              <HelpCircle size={13} className="text-gray-400 group-hover:text-[#c2185b] transition-colors" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight font-instrument text-[#111111] dark:text-[#ffffff]">
              {rmse != null ? Number(rmse).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-sans">MW</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between font-sans">
            <span>Severe miss penalty</span>
            <span className="font-mono text-amber-600 dark:text-amber-400">
              {mae != null && rmse != null ? `+${(rmse - mae).toFixed(1)} MW gap` : '—'}
            </span>
          </div>
        </div>

        {/* Forecast Bias Card */}
        <div className="relative p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft dashed-border-anim group">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 font-sans">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              Forecast Bias
            </span>
            <span title="Positive bias = over-forecasting (under-buying thermal power). Negative bias = under-forecasting (over-buying thermal power)">
              <HelpCircle size={13} className="text-gray-400 group-hover:text-[#c2185b] transition-colors" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl sm:text-4xl font-bold tracking-tight font-instrument ${
                isOverForecasting ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400"
              }`}
            >
              {bias != null ? `${bias > 0 ? "+" : ""}${Number(bias).toFixed(1)}` : '—'}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-sans">MW</span>
          </div>
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full font-sans ${
                isOverForecasting
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                  : "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
              }`}
            >
              <AlertTriangle size={10} />
              {isOverForecasting ? "Over-Forecasting (Short risk)" : "Under-Forecasting (Spill risk)"}
            </span>
          </div>
        </div>

        {/* Relative WMAPE / MAPE Card */}
        <div className="relative p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft dashed-border-anim group">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 font-sans">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              Volume Error (WMAPE)
            </span>
            <span title="Weighted MAPE = Sum(|Error|)/Sum(Actual) * 100%. Immune to division-by-zero during low-wind periods">
              <HelpCircle size={13} className="text-gray-400 group-hover:text-[#c2185b] transition-colors" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight font-instrument text-[#111111] dark:text-[#ffffff]">
              {wmape != null ? `${Number(wmape).toFixed(1)}%` : '—'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between font-sans">
            <span>Standard MAPE:</span>
            <span className="font-mono text-gray-700 dark:text-gray-300">
              {mape != null ? `${Number(mape).toFixed(1)}%` : '—'}
              {mapeExcludedCount > 0 && (
                <span className="text-[10px] text-gray-400 ml-1">({mapeExcludedCount} low-wind exc.)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Uncertainty & Distribution Envelope (P10 / P50 / P90) */}
      {errorPercentiles && (
        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
            <Compass size={15} className="text-[#c2185b] dark:text-[#f3b9c8]" />
            <span>Statistical Uncertainty Envelope (Forecast − Actual):</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <div>
              <span className="text-gray-500 dark:text-gray-400">P10 (Worst Under-forecast): </span>
              <span className="font-bold text-sky-600 dark:text-sky-400">
                {errorPercentiles.p10 > 0 ? "+" : ""}{errorPercentiles.p10} MW
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">P50 (Median Shift): </span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {errorPercentiles.p50_median > 0 ? "+" : ""}{errorPercentiles.p50_median} MW
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">P90 (Worst Over-forecast): </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {errorPercentiles.p90 > 0 ? "+" : ""}{errorPercentiles.p90} MW
              </span>
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              <span>Evaluated Intervals: </span>
              <span className="font-bold text-gray-900 dark:text-gray-200">{observationCount} hrs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
