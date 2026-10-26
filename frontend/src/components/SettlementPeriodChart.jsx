import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Clock, HelpCircle } from "lucide-react";

function SettlementTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="p-3 rounded-xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border border-black/10 dark:border-white/15 shadow-xl text-xs font-sans">
      <div className="font-semibold text-gray-900 dark:text-gray-100 border-b border-black/10 dark:border-white/10 pb-1 mb-2">
        Hour {data.hourOfDay}:00 UTC (Settlement Periods {data.settlementPeriodEstimate} & {data.settlementPeriodEstimate + 1})
      </div>
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between gap-4 text-gray-700 dark:text-gray-300">
          <span>Mean Absolute Error:</span>
          <span className="font-bold">{Number(data.mae).toFixed(1)} MW</span>
        </div>
        <div className="flex justify-between gap-4 text-gray-700 dark:text-gray-300">
          <span>Root Mean Sq Error:</span>
          <span className="font-bold">{Number(data.rmse).toFixed(1)} MW</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Bias:</span>
          <span className={`font-bold ${data.bias > 0 ? "text-amber-500" : "text-sky-500"}`}>
            {data.bias > 0 ? "+" : ""}{Number(data.bias).toFixed(1)} MW
          </span>
        </div>
        <div className="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400 pt-1 border-t border-black/5 dark:border-white/5">
          <span>Avg Outturn:</span>
          <span>{Number(data.avgActualMW).toFixed(0)} MW</span>
        </div>
      </div>
    </div>
  );
}

export default function SettlementPeriodChart({ data, loading }) {
  if (loading) {
    return (
      <div className="h-80 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] animate-pulse border border-black/5 dark:border-white/5" />
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const chartData = data.map((d) => ({
    ...d,
    label: `${String(d.hourOfDay).padStart(2, "0")}:00`,
  }));

  return (
    <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock size={16} className="text-[#c2185b] dark:text-[#f3b9c8]" />
            <span>Intraday Settlement Period Accuracy Profile</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Structural performance across the 24 hours of delivery (Settlement Periods 1 to 48).
          </p>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888888" }} />
            <YAxis tick={{ fontSize: 10, fill: "#888888" }} unit=" MW" />
            <Tooltip content={<SettlementTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Bar dataKey="mae" name="Mean Absolute Error (MW)" fill="#f3b9c8" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="bias"
              name="Forecast Bias (MW)"
              stroke="#c2185b"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
