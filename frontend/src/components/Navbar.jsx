import React from "react";
import { Activity, Wind, Database, FileText } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ theme, onToggleTheme, activeTab, onTabChange, backendHealthy }) {
  const navTabs = [
    { id: "overview", label: "Executive Dashboard", icon: Activity },
    { id: "hourly", label: "Settlement Profiles", icon: Wind },
    { id: "daily", label: "Daily Scorecard", icon: Database },
    { id: "methodology", label: "Methodology & Scope", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-[#0b0b0d]/80 border-b border-black/5 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c2185b] to-[#f3b9c8] flex items-center justify-center text-white shadow-sm">
            <Wind size={20} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-instrument text-2xl tracking-wide font-bold text-[#111111] dark:text-[#ffffff]">
                GridWind <span className="text-[#c2185b] dark:text-[#f3b9c8]">UK</span>
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                Day-Ahead Desk
              </span>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  backendHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>{backendHealthy ? "Elexon BMRS Jan 2026 Live" : "Connecting..."}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-full border border-black/5 dark:border-white/10">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-[#1a1a1c] text-[#111111] dark:text-[#ffffff] shadow-sm font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#c2185b] dark:text-[#f3b9c8]" : ""} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle & CTA */}
        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} size="sm" />
        </div>
      </div>
    </header>
  );
}
