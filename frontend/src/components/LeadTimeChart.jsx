import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Clock, TrendingUp, HelpCircle } from "lucide-react";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md rounded-xl shadow-xl border border-black/10 dark:border-white/10 text-xs font-sans">
        <div className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
          <Clock size={13} className="text-[#c2185b]" />
          <span>Horizon: {label} ({data.observationCount} intervals)</span>
        </div>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between gap-4 text-rose-500">
            <span>MAE (Absolute Error):</span>
            <span className="font-bold">{data.mae} MW</span>
          </div>
          <div className="flex justify-between gap-4 text-purple-400">
            <span>RMSE:</span>
            <span className="font-bold">{data.rmse} MW</span>
          </div>
          <div className="flex justify-between gap-4 text-amber-500">
            <span>Systematic Bias:</span>
            <span className="font-bold">+{data.bias} MW</span>
          </div>
          <div className="flex justify-between gap-4 text-emerald-500">
            <span>WMAPE:</span>
            <span className="font-bold">{data.wmape}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function LeadTimeChart({ data = [], loading = false }) {
  const decayData = data || [];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <h3 className="font-instrument text-xl font-bold text-gray-900 dark:text-white">
              Forecast Horizon & Lead-Time Error Decay
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Error magnitude (MAE / Bias) as a function of forecast lookahead time prior to settlement delivery.
          </p>
        </div>

        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">
          <TrendingUp size={13} className="text-indigo-500" />
          <span>Longer horizon = Increased volatility</span>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-xs text-gray-400">
          Computing lead-time decay curve...
        </div>
      ) : decayData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-gray-400">
          No decay data available for selected period.
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={decayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "currentColor" }} />
              <YAxis tick={{ fontSize: 11, fill: "currentColor" }} unit=" MW" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="mae" name="MAE (MW)" fill="#c2185b" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Line type="monotone" dataKey="rmse" name="RMSE (MW)" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="bias" name="Forecast Bias (MW)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
        <HelpCircle size={14} className="text-gray-400 shrink-0 mt-0.5" />
        <span>
          <strong>Procurement implication:</strong> Early auction runs (32h–36h+ ahead) carry higher variance. Balancing traders can reduce overall imbalance costs by re-trading residual wind delta in afternoon Intraday continuous auctions as newer 4h–8h runs become available.
        </span>
      </div>
    </div>
  );
}
