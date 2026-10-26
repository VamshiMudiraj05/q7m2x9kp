import React, { useState, useMemo } from "react";
import { Grid } from "lucide-react";

export default function SettlementHeatmap({ alignedSeries = [] }) {
  const [filterMode, setFilterMode] = useState("all"); // "all", "severe_over", "severe_under", "accurate"
  const [hoveredCell, setHoveredCell] = useState(null);

  // Group aligned data into day -> hour map (combining both settlement periods per hour when in half-hourly mode)
  const { matrix, days, hours } = useMemo(() => {
    const daysSet = new Set();
    const dayMap = {};

    alignedSeries.forEach((item) => {
      const day = item.settlementDate;
      const hour = item.hourOfDay;
      if (!day || hour === undefined) return;

      daysSet.add(day);
      if (!dayMap[day]) dayMap[day] = {};
      if (!dayMap[day][hour]) {
        dayMap[day][hour] = item;
      } else {
        const prev = dayMap[day][hour];
        const combinedActual = Math.round((prev.actualGeneration + item.actualGeneration) / 2);
        const combinedError = Math.round((prev.error + item.error) / 2);
        const combinedAbsError = Math.round((prev.absoluteError + item.absoluteError) / 2);
        dayMap[day][hour] = {
          ...item,
          actualGeneration: combinedActual,
          error: combinedError,
          absoluteError: combinedAbsError,
          settlementPeriodText: `SP ${prev.settlementPeriod} & ${item.settlementPeriod}`,
          spDetails: [prev, item],
        };
      }
    });

    const sortedDays = Array.from(daysSet).sort();
    const sortedHours = Array.from({ length: 24 }, (_, i) => i);

    return {
      matrix: dayMap,
      days: sortedDays,
      hours: sortedHours,
    };
  }, [alignedSeries]);

  const getCellColor = (item) => {
    if (!item) return "bg-gray-100 dark:bg-gray-800/40 border-transparent";

    const err = item.error;
    const absErr = item.absoluteError;

    // Check filter match
    if (filterMode === "severe_over" && err <= 2000) {
      return "opacity-20 bg-gray-200 dark:bg-gray-800 border-transparent";
    }
    if (filterMode === "severe_under" && err >= -500) {
      return "opacity-20 bg-gray-200 dark:bg-gray-800 border-transparent";
    }
    if (filterMode === "accurate" && absErr >= 1000) {
      return "opacity-20 bg-gray-200 dark:bg-gray-800 border-transparent";
    }

    if (absErr < 750) {
      return "bg-emerald-500/80 hover:bg-emerald-400 text-white";
    } else if (absErr < 1500) {
      return "bg-emerald-600/50 hover:bg-emerald-500/70 text-emerald-100";
    } else if (err > 2500) {
      return "bg-rose-600/90 hover:bg-rose-500 text-white animate-pulse-subtle";
    } else if (err > 1500) {
      return "bg-amber-500/80 hover:bg-amber-400 text-white";
    } else if (err < -1500) {
      return "bg-blue-600/80 hover:bg-blue-500 text-white";
    } else {
      return "bg-amber-400/60 hover:bg-amber-300 text-amber-950";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#c2185b]/10 text-[#c2185b] dark:text-[#f3b9c8] flex items-center justify-center">
              <Grid size={18} />
            </div>
            <h2 className="font-instrument text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              31-Day Settlement Error Heatmap Matrix
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visual breakdown of all {alignedSeries.length} settlement observations across January 2026. Hover over any cell for full dispatch & forecast metadata.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterMode === "all"
                ? "bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-white shadow-sm font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            }`}
          >
            All Periods ({alignedSeries.length})
          </button>
          <button
            onClick={() => setFilterMode("severe_over")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterMode === "severe_over"
                ? "bg-rose-500 text-white shadow-sm font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-rose-600"
            }`}
          >
            Severe Over-Forecast (&gt;+2 GW)
          </button>
          <button
            onClick={() => setFilterMode("accurate")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterMode === "accurate"
                ? "bg-emerald-600 text-white shadow-sm font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-emerald-600"
            }`}
          >
            Accurate (&lt;1 GW)
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs px-2 text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500" />
            <span>Accurate (&lt;750 MW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500" />
            <span>Moderate Bias (1.5–2.5 GW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-600" />
            <span>Severe Over-Forecast (&gt;2.5 GW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-600" />
            <span>Under-Forecast</span>
          </div>
        </div>

        {hoveredCell && (
          <div className="text-xs font-mono font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>{hoveredCell.settlementDate} @ {String(hoveredCell.hourOfDay).padStart(2, "0")}:00 UTC (SP {(hoveredCell.hourOfDay * 2) + 1})</span>
            <span className={`px-2 py-0.5 rounded text-[11px] ${hoveredCell.error > 0 ? "bg-rose-500/20 text-rose-600 dark:text-rose-400" : "bg-blue-500/20 text-blue-600 dark:text-blue-400"}`}>
              Err: {hoveredCell.error > 0 ? `+${hoveredCell.error}` : hoveredCell.error} MW
            </span>
          </div>
        )}
      </div>

      {/* Heatmap Grid Container */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 shadow-sm overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Hour Headers */}
          <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 pb-2 border-b border-black/5 dark:border-white/10 text-[10px] text-gray-400 font-mono text-center">
            <div className="text-left font-semibold">Date</div>
            {hours.map((h) => (
              <div key={h} className="truncate">
                {String(h).padStart(2, "0")}h
              </div>
            ))}
          </div>

          {/* Day Rows */}
          <div className="space-y-1 pt-2">
            {days.map((day) => {
              const dayStr = day.split("-").slice(1).join("/");
              return (
                <div
                  key={day}
                  className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 items-center hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded px-0.5 py-0.5 transition"
                >
                  <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                    {dayStr}
                  </div>
                  {hours.map((hour) => {
                    const item = matrix[day]?.[hour];
                    const colorClass = getCellColor(item);
                    return (
                      <div
                        key={hour}
                        onMouseEnter={() => item && setHoveredCell(item)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-6 rounded cursor-pointer transition-all duration-150 flex items-center justify-center text-[9px] font-mono select-none ${colorClass}`}
                        title={
                          item
                            ? `${day} ${hour}:00 UTC (SP ${item.settlementPeriod})\nActual: ${item.actualGeneration} MW\nForecast: ${item.forecastGeneration} MW\nError: ${item.error} MW\nLead Time: ${item.leadTimeHours}h`
                            : "No data"
                        }
                      >
                        {item && Math.abs(item.error) >= 3000 ? "!" : ""}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Cell Detail Card */}
      {hoveredCell ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#c2185b]/10 to-transparent border border-[#c2185b]/20 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c2185b] text-white flex items-center justify-center font-mono font-bold">
              SP{hoveredCell.settlementPeriod}
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                Interval: {hoveredCell.startTime}
              </div>
              <div className="text-gray-500 text-[11px]">
                Gate Cutoff: {hoveredCell.decisionCutoffTime} (Lead Time: {hoveredCell.leadTimeHours} hrs)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-gray-400 block text-[10px]">Actual</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {hoveredCell.actualGeneration.toLocaleString()} MW
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">DA Forecast</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {hoveredCell.forecastGeneration.toLocaleString()} MW
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Error</span>
              <span
                className={`font-bold ${
                  hoveredCell.error > 0 ? "text-rose-600 dark:text-rose-400" : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {hoveredCell.error > 0 ? `+${hoveredCell.error}` : hoveredCell.error} MW
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center text-xs text-gray-400 italic">
          Tip: Hover over any block in the heatmap above to inspect interval dispatch and auction lead time.
        </div>
      )}
    </div>
  );
}
