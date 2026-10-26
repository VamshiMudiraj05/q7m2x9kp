import React, { useState } from "react";
import { AlertTriangle, HelpCircle, X } from "lucide-react";

function MetricTooltip({
  title,
  plainEnglish,
  whatNumberMeans,
  whyItMatters,
  align = "left",
  isOpen,
  onOpen,
  onClose,
  onToggle,
}) {
  const alignClass =
    align === "left"
      ? "left-2 sm:left-3"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "right-2 sm:right-3";

  return (
    <div
      className="inline-flex items-center"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        aria-label={`Explain ${title} in plain English`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`p-1 -m-1 transition-colors rounded-full focus:outline-none cursor-pointer ${
          isOpen
            ? "text-[#c2185b] dark:text-[#f3b9c8] bg-[#c2185b]/10 dark:bg-[#f3b9c8]/10"
            : "text-gray-400 hover:text-[#c2185b] dark:hover:text-[#f3b9c8]"
        }`}
      >
        <HelpCircle size={15} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-12 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] p-4 rounded-2xl bg-white/98 dark:bg-[#18181c]/98 backdrop-blur-2xl border border-black/15 dark:border-white/20 shadow-2xl z-50 text-left normal-case tracking-normal font-sans text-xs text-gray-700 dark:text-gray-200 transition-all pointer-events-auto ring-1 ring-black/10 dark:ring-white/10 ${alignClass}`}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white pb-2.5 border-b border-black/10 dark:border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c2185b] dark:bg-[#f3b9c8]" />
              <span>{title}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close tooltip"
              className="p-1 -mr-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          <div className="mt-2.5 space-y-2.5">
            <div>
              <span className="font-semibold text-gray-900 dark:text-white block text-[10px] uppercase tracking-wider text-opacity-80">
                In Plain English:
              </span>
              <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mt-0.5">
                {plainEnglish}
              </p>
            </div>

            {whatNumberMeans && (
              <div className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/5 dark:border-white/5">
                <span className="font-semibold text-gray-900 dark:text-white block text-[10px] uppercase tracking-wider text-opacity-80">
                  What your number means:
                </span>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-0.5 leading-relaxed">
                  {whatNumberMeans}
                </p>
              </div>
            )}

            <div>
              <span className="font-semibold text-gray-900 dark:text-white block text-[10px] uppercase tracking-wider text-opacity-80">
                Why it matters for power buyers:
              </span>
              <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mt-0.5">
                {whyItMatters}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KPIOverview({ metrics, loading }) {
  const [activeMetric, setActiveMetric] = useState(null);

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] animate-pulse border border-black/5 dark:border-white/5"
          />
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
  } = metrics;

  const isOverForecasting = (bias ?? 0) > 0;

  const toggleMetric = (metricKey) => {
    setActiveMetric((prev) => (prev === metricKey ? null : metricKey));
  };

  const getCardZIndex = (metricKey) => {
    if (activeMetric === metricKey) return "z-40 ring-2 ring-[#c2185b]/30 dark:ring-[#f3b9c8]/30 shadow-xl";
    return "z-10 hover:z-30";
  };

  return (
    <div className="mb-6 relative z-30">
      {/* 4 Core Quantitative Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MAE Card */}
        <div
          className={`relative ${getCardZIndex("mae")} p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft dashed-border-anim group transition-all`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              Mean Absolute Error
            </span>
            <MetricTooltip
              title="Mean Absolute Error (MAE)"
              align="left"
              isOpen={activeMetric === "mae"}
              onOpen={() => setActiveMetric("mae")}
              onClose={() => setActiveMetric((prev) => (prev === "mae" ? null : prev))}
              onToggle={() => toggleMetric("mae")}
              plainEnglish="The average size of the forecast mistake, regardless of whether the prediction was too high or too low."
              whatNumberMeans={`On average, the wind prediction was off by ${mae != null ? Number(mae).toLocaleString() : '—'} MW in any given 30-minute interval.`}
              whyItMatters="Shows electricity buyers the typical buffer of backup power (e.g. gas plants) they regularly need to have on standby."
            />
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
        <div
          className={`relative ${getCardZIndex("rmse")} p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft dashed-border-anim group transition-all`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 font-sans">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              Root Mean Squared Error
            </span>
            <MetricTooltip
              title="Root Mean Squared Error (RMSE)"
              align="left"
              isOpen={activeMetric === "rmse"}
              onOpen={() => setActiveMetric("rmse")}
              onClose={() => setActiveMetric((prev) => (prev === "rmse" ? null : prev))}
              onToggle={() => toggleMetric("rmse")}
              plainEnglish="Similar to average error, but gives much harsher penalties to big mistakes instead of treating all misses equally."
              whatNumberMeans={`At ${rmse != null ? Number(rmse).toLocaleString() : '—'} MW, it is ${mae != null && rmse != null ? `+${(rmse - mae).toFixed(1)} MW higher` : '—'} than MAE. This gap proves there were large surprise swings rather than just steady small misses.`}
              whyItMatters="Big surprise forecast misses trigger emergency grid balancing and expensive last-minute power purchases at peak prices."
            />
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
        <div
          className={`relative ${getCardZIndex("bias")} p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft dashed-border-anim group transition-all`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 font-sans">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              Forecast Bias
            </span>
            <MetricTooltip
              title="Forecast Bias"
              align="right"
              isOpen={activeMetric === "bias"}
              onOpen={() => setActiveMetric("bias")}
              onClose={() => setActiveMetric((prev) => (prev === "bias" ? null : prev))}
              onToggle={() => toggleMetric("bias")}
              plainEnglish="Tells you whether the forecast systematically guesses too high (over-forecast) or too low (under-forecast)."
              whatNumberMeans={`At ${bias != null ? `${bias > 0 ? '+' : ''}${Number(bias).toFixed(1)}` : '—'} MW (Over-Forecasting), the forecast predicted ~${bias != null ? Math.round(Math.abs(bias)).toLocaleString() : '—'} MW MORE wind power than actually showed up.`}
              whyItMatters="Over-forecasting leaves the utility short on electricity at delivery time, forcing it to buy emergency power at costly UK cash-out rates."
            />
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
        <div
          className={`relative ${getCardZIndex("wmape")} p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft dashed-border-anim group transition-all`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 font-sans">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              Volume Error (WMAPE)
            </span>
            <MetricTooltip
              title="Volume Error (WMAPE)"
              align="right"
              isOpen={activeMetric === "wmape"}
              onOpen={() => setActiveMetric("wmape")}
              onClose={() => setActiveMetric((prev) => (prev === "wmape" ? null : prev))}
              onToggle={() => toggleMetric("wmape")}
              plainEnglish="The total error volume expressed as a percentage of all wind electricity produced throughout the month."
              whatNumberMeans={`At ${wmape != null ? Number(wmape).toFixed(1) : '—'}%, about 1 out of every 5.4 megawatt-hours of wind generation needed rebalancing.`}
              whyItMatters="Unlike standard percentage errors that blow up to 1,000%+ on calm days with near-zero wind, Weighted MAPE gives a realistic commercial percentage score for power procurement."
            />
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
    </div>
  );
}
