import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import FilterControls from "./components/FilterControls";
import KPIOverview from "./components/KPIOverview";
import ForecastChart from "./components/ForecastChart";
import SettlementPeriodChart from "./components/SettlementPeriodChart";
import DailyScorecardTable from "./components/DailyScorecardTable";
import MethodologyPanel from "./components/MethodologyPanel";
import { ErrorState } from "./components/StatusStates";
import { api } from "./services/api";
import { ShieldCheck } from "lucide-react";

export default function App() {
  // Theme state: defaults to dark mode for trading terminal feel
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("gridwind_theme") || "dark";
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Filter state (January 2026 evaluation period)
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-01-31");
  const [cutoffHour, setCutoffHour] = useState(11); // 11:00 UTC on D-1

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [alignedSeries, setAlignedSeries] = useState([]);
  const [settlementData, setSettlementData] = useState([]);
  const [dailyData, setDailyData] = useState([]);

  // UI status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendHealthy, setBackendHealthy] = useState(false);

  // Sync dark class on document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("gridwind_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Check health and load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Health probe
      try {
        const healthRes = await api.getHealth();
        setBackendHealthy(healthRes.status === "healthy");
      } catch {
        setBackendHealthy(false);
      }

      // 2. Fetch parallel dashboard resources
      const [metricsRes, seriesRes, settlementRes, dailyRes] = await Promise.all([
        api.getAccuracyMetrics(startDate, endDate, cutoffHour),
        api.getAlignedSeries(startDate, endDate, cutoffHour),
        api.getSettlementPeriods(startDate, endDate, cutoffHour),
        api.getDailyScorecard(startDate, endDate, cutoffHour),
      ]);

      setMetrics(metricsRes.metrics);
      setAlignedSeries(seriesRes.data || []);
      setSettlementData(settlementRes.data || []);
      setDailyData(dailyRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data from backend.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cutoffHour]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDateChange = (newStart, newEnd) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleCutoffChange = (newHour) => {
    setCutoffHour(newHour);
  };

  return (
    <div className="min-h-screen bg-[#fffefd] dark:bg-[#0b0b0d] text-[#222222] dark:text-[#ededed] bg-project-grid bg-radial-blush flex flex-col font-sans transition-colors duration-200">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backendHealthy={backendHealthy}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#c2185b]/10 text-[#c2185b] dark:text-[#f3b9c8] border border-[#c2185b]/20">
                <ShieldCheck size={12} />
                UK Wholesale Day-Ahead Desk
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Data Source: Elexon BMRS (FUELHH & WINDFOR)
              </span>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                {startDate} → {endDate}
              </span>
              <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">
                Gate: {String(cutoffHour).padStart(2, "0")}:00 UTC D-1
              </span>
            </div>
          </div>

          <h1 className="font-instrument font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-gray-900 dark:text-white">
            Day-Ahead Wind Forecast & Error Evaluation Portal
          </h1>
          <div className="font-instrument-sans font-semibold text-base sm:text-lg text-[#c2185b] dark:text-[#f3b9c8] mt-1 tracking-tight">
            Elexon BMRS January 2026 Wholesale Procurement Benchmark
          </div>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
            Quantitative decision support for electricity procurement in the UK wholesale market. Evaluates national wind generation forecasts available at gate closure to quantify balancing risk, thermal top-up requirements, and cash-out error margins for January 2026.
          </p>
        </div>

        {/* Global Filter Bar */}
        <FilterControls
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          cutoffHour={cutoffHour}
          onCutoffChange={handleCutoffChange}
          onRefresh={loadDashboardData}
          loading={loading}
        />

        {/* Error State */}
        {error && <ErrorState message={error} onRetry={loadDashboardData} />}

        {/* Active Tab View */}
        {!error && (
          <>
            {activeTab === "overview" && (
              <div>
                <KPIOverview metrics={metrics} loading={loading} />
                <ForecastChart data={alignedSeries} loading={loading} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SettlementPeriodChart data={settlementData} loading={loading} />
                  <DailyScorecardTable data={dailyData} loading={loading} />
                </div>
              </div>
            )}

            {activeTab === "hourly" && (
              <div>
                <SettlementPeriodChart data={settlementData} loading={loading} />
                <ForecastChart data={alignedSeries} loading={loading} />
              </div>
            )}

            {activeTab === "daily" && (
              <div>
                <DailyScorecardTable data={dailyData} loading={loading} />
              </div>
            )}

            {activeTab === "methodology" && <MethodologyPanel />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-white/10 py-6 text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-[#0b0b0d]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-gray-800 dark:text-gray-200">GridWind UK Analytics</span> — Full Stack SWE Challenge Delivery.
            <div className="text-[11px] text-gray-500">
              National wind power actuals (FUELHH) and forecasts (WINDFOR) provided by Elexon BMRS.
            </div>
          </div>
          <div className="text-[11px]">
            <span>Developed with assisted AI tools as declared in repository README.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
