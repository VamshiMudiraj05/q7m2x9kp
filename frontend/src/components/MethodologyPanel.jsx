import React from "react";
import { BookOpen, ShieldCheck, Scale, Cpu, AlertCircle } from "lucide-react";

export default function MethodologyPanel() {
  return (
    <div className="space-y-6 mb-8 text-xs font-sans text-gray-700 dark:text-gray-300">
      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft">
        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-900 dark:text-gray-100">
          <BookOpen size={18} className="text-[#c2185b] dark:text-[#f3b9c8]" />
          <span>UK Day-Ahead Power Market Evaluation Methodology</span>
        </div>
        <p className="leading-relaxed mb-4">
          In the UK wholesale power market, energy utilities must cover consumer electricity demand through Day-Ahead market commitments (e.g. EPEX SPOT and Nord Pool auctions). Because renewable wind generation is intermittent, power purchasers must forecast wind production accurately to determine how much thermal or flexible generation to buy one day before delivery.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-black/5 dark:border-white/10">
          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1.5">
              <Scale size={14} className="text-emerald-500" />
              Actual Generation (Elexon FUELHH)
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Outturn national generation by fuel type at 30-minute resolution (48 settlement periods daily). Filtered strictly for <code>fuelType = WIND</code> across all 31 days of January 2026 (1,489 records).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1.5">
              <Cpu size={14} className="text-[#c2185b]" />
              Forecast Generation (Elexon WINDFOR)
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              National wind forecast runs published by National Grid ESO ~8 times daily at hourly resolution (24 points per delivery day). Over 19,270 forecast records ingested for January 2026.
            </p>
          </div>
        </div>
      </div>

      {/* D-1 Decision Gate Closure Card */}
      <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft">
        <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          <ShieldCheck size={18} className="text-[#c2185b] dark:text-[#f3b9c8]" />
          <span>Operational Day-Ahead Decision Gate (No Lookahead Bias)</span>
        </div>
        <p className="leading-relaxed mb-3">
          To simulate the genuine information available to a power purchaser when auction bids are submitted:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400 mb-4">
          <li>
            <strong>Day-Ahead Auction Cutoff:</strong> For physical delivery on day <span className="font-mono">D</span>, commitments close on day <span className="font-mono">D-1</span> at <strong>11:00 UTC</strong> (default EPEX SPOT UK auction deadline).
          </li>
          <li>
            <strong>Selection Filter:</strong> Only forecast runs published on or before 11:00 UTC on day <span className="font-mono">D-1</span> are eligible. Among eligible candidates for each delivery interval, the latest publication is selected.
          </li>
          <li>
            <strong>Lookahead Protection:</strong> Forecasts issued after 11:00 UTC on D-1 or intraday on day D are excluded from the Day-Ahead baseline.
          </li>
        </ul>
      </div>

      {/* Error Metrics Mathematical Definitions */}
      <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
          Quantitative Error Metrics & Financial Impact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1 font-mono text-[11px]">
            <div className="font-bold text-gray-900 dark:text-gray-100 font-sans">
              Mean Absolute Error (MAE)
            </div>
            <div className="text-gray-500">Formula: (1/N) * Σ |Forecast - Actual|</div>
            <div className="text-gray-700 dark:text-gray-300 font-sans text-[10px]">
              Directly translates to average thermal procurement adjustment needed per hour.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1 font-mono text-[11px]">
            <div className="font-bold text-gray-900 dark:text-gray-100 font-sans">
              Root Mean Squared Error (RMSE)
            </div>
            <div className="text-gray-500">Formula: sqrt((1/N) * Σ (Forecast - Actual)²)</div>
            <div className="text-gray-700 dark:text-gray-300 font-sans text-[10px]">
              Penalizes large forecast spikes that risk massive Balancing Mechanism cash-out charges.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1 font-mono text-[11px]">
            <div className="font-bold text-gray-900 dark:text-gray-100 font-sans">
              Forecast Bias (Signed Mean Error)
            </div>
            <div className="text-gray-500">Formula: (1/N) * Σ (Forecast - Actual)</div>
            <div className="text-gray-700 dark:text-gray-300 font-sans text-[10px]">
              Positive = Over-forecasting (under-buying thermal). Negative = Under-forecasting (over-buying thermal).
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1 font-mono text-[11px]">
            <div className="font-bold text-gray-900 dark:text-gray-100 font-sans">
              Volume-Weighted MAPE (WMAPE)
            </div>
            <div className="text-gray-500">Formula: (Σ |Error| / Σ Actual) * 100%</div>
            <div className="text-gray-700 dark:text-gray-300 font-sans text-[10px]">
              Standard in energy trading; avoids division-by-zero artifacts during calm, low-wind periods.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
