import React, { useState } from "react";
import { Table, ArrowUpDown, Calendar } from "lucide-react";

export default function DailyScorecardTable({ data, loading }) {
  const [sortField, setSortField] = useState("date");
  const [sortAsc, setSortAsc] = useState(true);

  if (loading) {
    return (
      <div className="h-64 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] animate-pulse border border-black/5 dark:border-white/5" />
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal ?? 0) - (bVal ?? 0) : (bVal ?? 0) - (aVal ?? 0);
  });

  return (
    <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#121214]/70 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-soft mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar size={16} className="text-[#c2185b] dark:text-[#f3b9c8]" />
            <span>Daily Procurement Accuracy Scorecard</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Day-by-day evaluation metrics across the January 2026 trading period.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 font-semibold">
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center gap-1">
                  <span>Delivery Date</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort("mae")}>
                <div className="flex items-center justify-end gap-1">
                  <span>MAE (MW)</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort("rmse")}>
                <div className="flex items-center justify-end gap-1">
                  <span>RMSE (MW)</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort("bias")}>
                <div className="flex items-center justify-end gap-1">
                  <span>Bias (MW)</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort("wmape")}>
                <div className="flex items-center justify-end gap-1">
                  <span>WMAPE</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Outturn Volume</th>
              <th className="py-2.5 px-3 text-center">Bias Tendency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono text-[11px]">
            {sortedData.map((row) => {
              const isOver = row.bias > 0;
              return (
                <tr key={row.date} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100 font-sans">
                    {row.date}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-800 dark:text-gray-200">
                    {Number(row.mae).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-800 dark:text-gray-200">
                    {Number(row.rmse).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold ${
                      isOver ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400"
                    }`}
                  >
                    {row.bias > 0 ? "+" : ""}{Number(row.bias).toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-800 dark:text-gray-200">
                    {row.wmape != null ? `${Number(row.wmape).toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400">
                    {Number(row.totalActualMW).toLocaleString()} MW
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                        isOver
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                      }`}
                    >
                      {isOver ? "Over-forecast" : "Under-forecast"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
