import React from "react";
import { AlertCircle, RefreshCw, Database } from "lucide-react";

export function ErrorState({ message, onRetry }) {
  return (
    <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 flex flex-col items-center justify-center text-center my-6">
      <AlertCircle size={32} className="mb-2 text-rose-600 dark:text-rose-400" />
      <h3 className="font-bold text-sm mb-1">Backend Communication Error</h3>
      <p className="text-xs max-w-md mb-4 text-rose-700 dark:text-rose-400">
        {message || "Unable to reach the Python FastAPI service. Please ensure the backend is running at http://localhost:8000."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
        >
          <RefreshCw size={13} />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div className="p-8 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 flex flex-col items-center justify-center text-center my-6 text-gray-500">
      <Database size={32} className="mb-2 text-gray-400" />
      <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">No Observations Found</h3>
      <p className="text-xs max-w-md">
        {message || "No matched actuals or forecasts are available for the selected dates and gate cutoff."}
      </p>
    </div>
  );
}
