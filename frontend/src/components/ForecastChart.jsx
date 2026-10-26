import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Calendar, Clock, Info, Layers } from "lucide-react";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const {
    startTime,
    settlementDate,
    settlementPeriod,
    actualGeneration,
    forecastGeneration,
    error,
    publishTime,
    leadTimeHours,
  } = data;

  const isOver = error > 0;

  return (
    <div className="p-3.5 rounded-xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border border-black/10 dark:border-white/15 shadow-xl text-xs font-sans max-w-xs">
      <div className="font-semibold text-gray-900 dark:text-gray-100 border-b border-black/10 dark:border-white/10 pb-1.5 mb-2 flex items-center justify-between">
        <span>{settlementDate} (Period {settlementPeriod})</span>
        <span className="font-mono text-[10px] text-gray-500">{startTime.slice(11, 16)} UTC</span>
      </div>

      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Actual Outturn:
          </span>
          <span className="font-bold">{Number(actualGeneration).toLocaleString()} MW</span>
        </div>

        <div className="flex items-center justify-between text-[#c2185b] dark:text-[#f3b9c8]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#c2185b] inline-block" />
            Day-Ahead Forecast:
          </span>
          <span className="font-bold">{Number(forecastGeneration).toLocaleString()} MW</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/10">
          <span className="text-gray-600 dark:text-gray-300">Forecast Error:</span>
          <span
            className={`font-bold ${
              isOver ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400"
            }`}
          >
            {error > 0 ? "+" : ""}{Number(error).toLocaleString()} MW ({isOver ? "Over" : "Under"})
          </span>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5">
        <div className="flex items-center gap-1">
          <Clock size={10} />
          <span>Forecast Run: {publishTime ? publishTime.replace("T", " ").replace("Z", " UTC") : "—"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Info size={10} />
          <span>Lead Time: {leadTimeHours ? `${leadTimeHours} hrs ahead of delivery` : "—"}</span>
        </div>
      </div>
    </div>
  );
}

export default function ForecastChart({ data, loading }) {
  const [chartType, setChartType] = useState("lines"); // "lines" or "area"

  if (loading) {
    return (
      <div className="h-96 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] animate-pulse border border-black/5 dark:border-white/5 flex items-center justify-center text-xs text-gray-400">
        Loading settlement series...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-96 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 flex flex-col items-center justify-center text-xs text-gray-500">
        <Calendar size={28} className="text-gray-400 mb-2" />
        <span>No matching settlement intervals found for the selected period.</span>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((d) => ({
    ...d,
    timeLabel: `${d.startTime.slice(5, 10)} ${d.startTime.slice(11, 16)}`,
  }));

  return (
    <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>Day-Ahead Forecast vs Outturn Actual Generation</span>
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              ({chartData.length} settlement intervals)
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            National wind power generation in MW evaluated strictly against latest forecast available before D-1 auction gate.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.05] p-1 rounded-lg border border-black/5 dark:border-white/10 text-xs">
            <button
              onClick={() => setChartType("lines")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                chartType === "lines"
                  ? "bg-white dark:bg-[#202024] text-black dark:text-white shadow-xs font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            >
              Overlay Lines
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                chartType === "area"
                  ? "bg-white dark:bg-[#202024] text-black dark:text-white shadow-xs font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            >
              Volume Areas
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "lines" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 10, fill: "#888888" }}
                interval={Math.ceil(chartData.length / 12)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#888888" }}
                unit=" MW"
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                formatter={(val) => (
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{val}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="actualGeneration"
                name="Actual Wind Outturn (FUELHH)"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="forecastGeneration"
                name="Day-Ahead Forecast (WINDFOR)"
                stroke="#c2185b"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c2185b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#c2185b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 10, fill: "#888888" }}
                interval={Math.ceil(chartData.length / 12)}
              />
              <YAxis tick={{ fontSize: 10, fill: "#888888" }} unit=" MW" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Area
                type="monotone"
                dataKey="actualGeneration"
                name="Actual Wind Outturn"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorActual)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="forecastGeneration"
                name="Day-Ahead Forecast"
                stroke="#c2185b"
                fillOpacity={1}
                fill="url(#colorForecast)"
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
