import React from "react";
import { AlertTriangle, TrendingUp, ShieldAlert, Lightbulb } from "lucide-react";

export default function ExecutiveBriefing({ metrics }) {
  if (!metrics || metrics.observationCount === 0) return null;

  const bias = metrics.bias || 0;
  const totalHours = metrics.observationCount || 744;
  // Total volume imbalance in GWh: bias (MW) * hours / 1000
  const totalImbalanceGWh = Math.round((Math.abs(bias) * totalHours) / 1000);

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent border border-amber-500/20 dark:border-amber-400/20 p-5 sm:p-6 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="font-instrument text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Quant Trading Desk Intelligence Briefing
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              January 2026 Elexon BMRS Wholesale Imbalance & Hedging Analysis
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          High Exposure Risk: Persistent Positive Bias
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
        {/* Card 1: The Systematic Bias */}
        <div className="p-4 rounded-xl bg-white/70 dark:bg-black/40 border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold mb-1.5">
            <TrendingUp size={15} />
            <span>Structural Over-Forecast (+{bias.toLocaleString()} MW)</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs">
            WINDFOR systematically overestimated actual output across January 2026. Day-Ahead procurement based on raw forecasts would incur approximately <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{totalImbalanceGWh.toLocaleString()} GWh</span> of net negative imbalance.
          </p>
        </div>

        {/* Card 2: Cash-out Penalty Risk */}
        <div className="p-4 rounded-xl bg-white/70 dark:bg-black/40 border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold mb-1.5">
            <ShieldAlert size={15} />
            <span>Balancing Mechanism Exposure</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs">
            Short positions are settled at the UK System Buy Price (SBP). During peak demand winter snaps, cash-out prices often exceed £150–£250/MWh, making unhedged wind shortfalls exponentially more expensive than pre-contracted CCGT baseload.
          </p>
        </div>

        {/* Card 3: Actionable Strategy */}
        <div className="p-4 rounded-xl bg-white/70 dark:bg-black/40 border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1.5">
            <Lightbulb size={15} />
            <span>Recommended Trading Strategy</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs">
            Apply a dynamic <span className="font-semibold text-emerald-600 dark:text-emerald-400">15% haircut</span> or Kalman bias adjustment to Day-Ahead wind schedules, and purchase flexible peaker options for the morning ramp window (08:00–11:00 UTC).
          </p>
        </div>
      </div>
    </div>
  );
}
