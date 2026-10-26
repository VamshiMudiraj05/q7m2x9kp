import React from "react";
import { AlertTriangle, TrendingUp, ShieldAlert, Lightbulb } from "lucide-react";

export default function ExecutiveBriefing({ metrics }) {
  if (!metrics || metrics.observationCount === 0) return null;

  const bias = metrics.bias || 0;
  const observationCount = metrics.observationCount || 1488;
  const totalDeliveryHours = metrics.totalDeliveryHours || (observationCount === 1488 ? 744 : observationCount);
  // Total volume imbalance in GWh: calculated directly from backend or bias (MW) * delivery hours / 1000
  const totalImbalanceGWh = metrics.totalEnergyImbalanceGWh != null
    ? Math.abs(metrics.totalEnergyImbalanceGWh)
    : Math.round((Math.abs(bias) * totalDeliveryHours) / 1000);

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
          Exposure Risk: Persistent Positive Bias (+{bias.toLocaleString()} MW)
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
            WINDFOR systematically overestimated actual output across January 2026 ({observationCount === 1488 ? "1,488 half-hourly settlement periods" : `${observationCount} hourly intervals`} / {totalDeliveryHours} delivery hours). Day-Ahead procurement assuming full forecast yields <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{totalImbalanceGWh.toLocaleString()} GWh</span> of net physical shortfall (negative imbalance).
          </p>
        </div>

        {/* Card 2: Cash-out Penalty Risk */}
        <div className="p-4 rounded-xl bg-white/70 dark:bg-black/40 border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold mb-1.5">
            <ShieldAlert size={15} />
            <span>Balancing Mechanism Cash-Out</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs">
            In GB electricity trading (BSC), under-delivery leaves a utility in a short position settled at the half-hourly System Buy Price (SBP). Over-forecasting wind leads to under-procurement of thermal/import power, leaving the portfolio directly exposed to cash-out penalties.
          </p>
        </div>

        {/* Card 3: Actionable Strategy */}
        <div className="p-4 rounded-xl bg-white/70 dark:bg-black/40 border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1.5">
            <Lightbulb size={15} />
            <span>Analytical Hedging Guidance</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs">
            Evaluate rolling empirical bias adjustments or state-space Kalman filtering to de-bias Day-Ahead nominations before gate closure. <em>(Note: 15% haircut and fixed SBP values are illustrative stress-test assumptions, not guaranteed market returns.)</em>
          </p>
        </div>
      </div>
    </div>
  );
}
