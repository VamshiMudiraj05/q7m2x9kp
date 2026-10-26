import React from "react";
import { Activity, Wind, Database, FileText, Calculator, Grid, Download } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({
  theme,
  onToggleTheme,
  activeTab,
  onTabChange,
  backendHealthy,
  onExportCsv,
}) {
  const navTabs = [
    { id: "overview", label: "Dashboard", icon: Activity },
    { id: "simulator", label: "Risk Simulator", icon: Calculator },
    { id: "heatmap", label: "Heatmap", icon: Grid },
    { id: "hourly", label: "Settlement Profiles", icon: Wind },
    { id: "daily", label: "Daily Scorecard", icon: Database },
    { id: "methodology", label: "Methodology", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-[#0b0b0d]/85 border-b border-black/5 dark:border-white/10 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c2185b] to-[#f3b9c8] flex items-center justify-center text-white shadow-sm shrink-0">
            <Wind size={20} className="animate-spin-slow" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-instrument font-bold text-2xl md:text-[27px] tracking-tight text-[#111111] dark:text-[#ffffff] leading-none whitespace-nowrap">
                GridWind <span className="text-[#c2185b] dark:text-[#f3b9c8]">UK</span>
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 whitespace-nowrap leading-none">
                Day-Ahead Desk
              </span>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 whitespace-nowrap leading-none mt-1">
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  backendHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>{backendHealthy ? "Elexon BMRS Jan 2026 Live" : "Connecting..."}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-full border border-black/5 dark:border-white/10 shrink-0">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white dark:bg-[#1a1a1c] text-[#111111] dark:text-[#ffffff] shadow-sm font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <Icon size={13} className={isActive ? "text-[#c2185b] dark:text-[#f3b9c8]" : ""} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle & CSV Export CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onExportCsv}
            title="Download full January 2026 dataset as CSV for quantitative analysis"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 text-xs font-medium border border-black/5 dark:border-white/10 transition cursor-pointer whitespace-nowrap"
          >
            <Download size={14} className="text-[#c2185b] dark:text-[#f3b9c8]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} size="sm" />
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden flex items-center justify-around px-2 py-1.5 border-t border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#0b0b0d]/90 overflow-x-auto text-[11px]">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${
                isActive
                  ? "text-[#c2185b] dark:text-[#f3b9c8] font-bold"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

