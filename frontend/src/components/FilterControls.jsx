import React from "react";
import { Calendar, Clock, RefreshCw, Filter } from "lucide-react";

export default function FilterControls({
  startDate,
  endDate,
  onDateChange,
  cutoffHour,
  onCutoffChange,
  resolution = "half_hourly",
  onResolutionChange,
  onRefresh,
  loading,
}) {
  const presets = [
    { label: "Full Month (Jan 2026)", start: "2026-01-01", end: "2026-01-31" },
    { label: "Week 1 (Jan 1-7)", start: "2026-01-01", end: "2026-01-07" },
    { label: "Week 2 (Jan 8-14)", start: "2026-01-08", end: "2026-01-14" },
    { label: "Week 3 (Jan 15-21)", start: "2026-01-15", end: "2026-01-21" },
    { label: "Week 4 (Jan 22-31)", start: "2026-01-22", end: "2026-01-31" },
  ];

  const gateOptions = [
    { hour: 9, label: "09:00 UTC D-1 (Early run)" },
    { hour: 11, label: "11:00 UTC D-1 (EPEX SPOT Gate)" },
    { hour: 12, label: "12:00 UTC D-1 (Nord Pool Auction)" },
    { hour: 17, label: "17:00 UTC D-1 (Late afternoon)" },
  ];

  return (
    <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#121214]/80 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft mb-6 space-y-3.5">
      {/* Row 1: Presets + Refresh Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
            <Filter size={13} />
            Presets:
          </span>
          {presets.map((preset) => {
            const isActive = startDate === preset.start && endDate === preset.end;
            return (
              <button
                key={preset.label}
                onClick={() => onDateChange(preset.start, preset.end)}
                className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#c2185b] text-white font-semibold shadow-xs"
                    : "bg-black/[0.04] dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh data"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-[#c2185b]" : ""} />
          <span>{loading ? "Updating..." : "Refresh"}</span>
        </button>
      </div>

      {/* Row 2: Date Pickers, Day-Ahead Gate, & Temporal Resolution */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-black/5 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2 text-xs bg-black/[0.03] dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/10">
            <Calendar size={13} className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400 text-[11px]">Window:</span>
            <input
              type="date"
              value={startDate}
              min="2026-01-01"
              max="2026-01-31"
              onChange={(e) => onDateChange(e.target.value, endDate)}
              className="bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none font-mono text-xs cursor-pointer"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              min="2026-01-01"
              max="2026-01-31"
              onChange={(e) => onDateChange(startDate, e.target.value)}
              className="bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none font-mono text-xs cursor-pointer"
            />
          </div>

          {/* Day-Ahead Cutoff Gate Selector */}
          <div className="flex items-center gap-1.5 text-xs bg-black/[0.03] dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/10">
            <Clock size={13} className="text-[#c2185b] dark:text-[#f3b9c8]" />
            <span className="text-gray-500 dark:text-gray-400 text-[11px]">D-1 Gate:</span>
            <select
              value={cutoffHour}
              onChange={(e) => onCutoffChange(Number(e.target.value))}
              className="bg-transparent text-gray-900 dark:text-gray-100 font-semibold text-xs focus:outline-none cursor-pointer"
            >
              {gateOptions.map((opt) => (
                <option key={opt.hour} value={opt.hour} className="dark:bg-[#18181b]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Resolution Selector: Half-Hourly vs Hourly Aggregated */}
          <div className="flex items-center gap-1.5 text-xs bg-black/[0.03] dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/10">
            <span className="text-gray-500 dark:text-gray-400 text-[11px]">Resolution:</span>
            <select
              value={resolution}
              onChange={(e) => onResolutionChange && onResolutionChange(e.target.value)}
              className="bg-transparent text-gray-900 dark:text-gray-100 font-semibold text-xs focus:outline-none cursor-pointer"
            >
              <option value="half_hourly" className="dark:bg-[#18181b]">
                Half-Hourly (48 SP/Day • 1,488 Total) [BSC Standard]
              </option>
              <option value="hourly_aggregated" className="dark:bg-[#18181b]">
                Hourly Aggregated (24h/Day • 744 Total)
              </option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1">
          <span>Delivery Month:</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">January 2026</span>
        </div>
      </div>
    </div>
  );
}
