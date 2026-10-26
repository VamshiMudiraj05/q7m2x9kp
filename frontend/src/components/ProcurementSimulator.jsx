import React, { useState, useMemo } from "react";
import { Calculator, TrendingDown, Shield, Sliders, CheckCircle2 } from "lucide-react";

export default function ProcurementSimulator({ metrics }) {
  // Simulator inputs
  const [contractedWindMW, setContractedWindMW] = useState(2500); // User portfolio MW
  const [cashoutPrice, setCashoutPrice] = useState(135); // £/MWh System Buy Price
  const [dayAheadForwardPrice, setDayAheadForwardPrice] = useState(85); // £/MWh DA power price
  const [strategy, setStrategy] = useState("bias_corrected"); // "naive", "bias_corrected", "conservative_p10"

  const nationalAvgActual = metrics?.totalActualGenerationMW && metrics?.observationCount
    ? metrics.totalActualGenerationMW / metrics.observationCount
    : 11500;
  const nationalAvgForecast = metrics?.totalForecastGenerationMW && metrics?.observationCount
    ? metrics.totalForecastGenerationMW / metrics.observationCount
    : 13340;
  const totalHours = metrics?.observationCount || 744;

  const simulationResults = useMemo(() => {
    // Portfolio average actual vs forecast
    const portForecastMW = contractedWindMW;
    const portActualMW = portForecastMW * (nationalAvgActual / nationalAvgForecast);
    const hourlyShortfallMW = Math.max(0, portForecastMW - portActualMW);

    // Strategy A: Naive (hedge 100% of raw forecast)
    // Exposure: Short by hourlyShortfallMW for totalHours -> paid at cashoutPrice
    const naiveVolumeShortMWh = hourlyShortfallMW * totalHours;
    const naiveCashoutCost = naiveVolumeShortMWh * cashoutPrice;

    // Strategy B: Bias Corrected
    // Trader hedges at (Raw - PortfolioBias) -> buys extra thermal forward at DA price £85/MWh instead of £135/MWh cashout
    const biasCorrectionMW = hourlyShortfallMW;
    const daForwardCost = biasCorrectionMW * totalHours * dayAheadForwardPrice;
    const remainingCashoutVolMWh = Math.round(naiveVolumeShortMWh * 0.15); // 85% imbalance eliminated
    const biasCorrectedCashoutCost = remainingCashoutVolMWh * cashoutPrice + daForwardCost;
    const biasSavings = Math.max(0, naiveCashoutCost - biasCorrectedCashoutCost);

    // Strategy C: Conservative P10
    // Procurement includes safety thermal peaker reserve
    const p10BufferMW = hourlyShortfallMW * 1.35;
    const p10ForwardCost = p10BufferMW * totalHours * dayAheadForwardPrice;
    const p10CashoutVolMWh = Math.round(naiveVolumeShortMWh * 0.05); // 95% eliminated
    const p10TotalCost = p10CashoutVolMWh * cashoutPrice + p10ForwardCost;
    const p10Savings = Math.max(0, naiveCashoutCost - p10TotalCost);

    let activeCost = naiveCashoutCost;
    let activeSavings = 0;
    let activeImbalanceMWh = naiveVolumeShortMWh;

    if (strategy === "bias_corrected") {
      activeCost = biasCorrectedCashoutCost;
      activeSavings = biasSavings;
      activeImbalanceMWh = remainingCashoutVolMWh;
    } else if (strategy === "conservative_p10") {
      activeCost = p10TotalCost;
      activeSavings = p10Savings;
      activeImbalanceMWh = p10CashoutVolMWh;
    }

    return {
      naiveCashoutCost,
      naiveVolumeShortMWh,
      activeCost,
      activeSavings,
      activeImbalanceMWh,
      savingsPercent: naiveCashoutCost > 0 ? (activeSavings / naiveCashoutCost) * 100 : 0,
      hourlyShortfallMW: Math.round(hourlyShortfallMW),
    };
  }, [contractedWindMW, cashoutPrice, dayAheadForwardPrice, strategy, nationalAvgActual, nationalAvgForecast, totalHours]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#c2185b]/10 text-[#c2185b] dark:text-[#f3b9c8] flex items-center justify-center">
              <Calculator size={18} />
            </div>
            <h2 className="font-instrument text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Imbalance Risk & Procurement Strategy Simulator
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Simulate your utility portfolio's financial cash-out exposure and test bias-correction hedging strategies against January 2026 Elexon settlement prices.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-300">
          UK Balancing Mechanism (Elexon SBP)
        </div>
      </div>

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white pb-3 border-b border-black/5 dark:border-white/10">
            <Sliders size={16} className="text-[#c2185b] dark:text-[#f3b9c8]" />
            <span>Portfolio & Market Parameters</span>
          </div>

          {/* Slider 1: Contracted Wind MW */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-600 dark:text-gray-400">Wind Portfolio Capacity</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {contractedWindMW.toLocaleString()} MW
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="8000"
              step="100"
              value={contractedWindMW}
              onChange={(e) => setContractedWindMW(Number(e.target.value))}
              className="w-full accent-[#c2185b] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>200 MW (Small)</span>
              <span>4,000 MW</span>
              <span>8,000 MW (Major)</span>
            </div>
          </div>

          {/* Slider 2: System Buy Cash-Out Price */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-600 dark:text-gray-400">Balancing Cash-Out (SBP)</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                £{cashoutPrice}/MWh
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="300"
              step="5"
              value={cashoutPrice}
              onChange={(e) => setCashoutPrice(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>£60 (Mild)</span>
              <span>£135 (Jan Avg)</span>
              <span>£300 (Scarcity)</span>
            </div>
          </div>

          {/* Slider 3: Day-Ahead Thermal Forward Price */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-600 dark:text-gray-400">Day-Ahead Forward Price</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                £{dayAheadForwardPrice}/MWh
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              step="5"
              value={dayAheadForwardPrice}
              onChange={(e) => setDayAheadForwardPrice(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>£50/MWh</span>
              <span>£85/MWh</span>
              <span>£160/MWh</span>
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="pt-2 border-t border-black/5 dark:border-white/10">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Procurement Strategy:
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setStrategy("naive")}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition border cursor-pointer ${
                  strategy === "naive"
                    ? "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300 font-semibold"
                    : "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Strategy 1: 100% Raw Forecast</span>
                  {strategy === "naive" && <CheckCircle2 size={14} />}
                </div>
                <div className="text-[11px] font-normal text-gray-500 mt-0.5">
                  Unhedged. Fully exposed to positive forecast bias.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStrategy("bias_corrected")}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition border cursor-pointer ${
                  strategy === "bias_corrected"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                    : "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Strategy 2: Bias-Corrected Forward Hedging</span>
                  {strategy === "bias_corrected" && <CheckCircle2 size={14} />}
                </div>
                <div className="text-[11px] font-normal text-gray-500 mt-0.5">
                  Deduct historical 1,840 MW bias & pre-procure Day-Ahead forward power.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStrategy("conservative_p10")}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition border cursor-pointer ${
                  strategy === "conservative_p10"
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold"
                    : "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Strategy 3: P10 Conservative Buffer</span>
                  {strategy === "conservative_p10" && <CheckCircle2 size={14} />}
                </div>
                <div className="text-[11px] font-normal text-gray-500 mt-0.5">
                  Hedge to 10th percentile downside. Near zero balancing penalty risk.
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 shadow-sm">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total Month Imbalance</span>
              <div className="font-instrument font-bold text-3xl text-gray-900 dark:text-white mt-1">
                {Math.round(simulationResults.activeImbalanceMWh).toLocaleString()}{" "}
                <span className="text-sm font-sans text-gray-400">MWh</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Average shortfall: ~{simulationResults.hourlyShortfallMW} MW/hr
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 shadow-sm">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total Settlement Cost</span>
              <div className="font-instrument font-bold text-3xl text-gray-900 dark:text-white mt-1">
                £{(simulationResults.activeCost / 1_000_000).toFixed(2)}{" "}
                <span className="text-sm font-sans text-gray-400">Million</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Balancing cash-out + forward power
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-sm">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                Cost Avoidance / Savings
              </span>
              <div className="font-instrument font-bold text-3xl text-emerald-700 dark:text-emerald-300 mt-1">
                £{(simulationResults.activeSavings / 1_000_000).toFixed(2)}{" "}
                <span className="text-sm font-sans text-emerald-600">M</span>
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingDown size={13} />
                <span>{simulationResults.savingsPercent.toFixed(1)}% vs. Naive Strategy</span>
              </div>
            </div>
          </div>

          {/* Strategy Comparison Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 shadow-sm">
            <h3 className="font-instrument text-lg font-bold text-gray-900 dark:text-white mb-4">
              Strategy Economic Comparison (January 2026 Run)
            </h3>

            <div className="space-y-4">
              {/* Bar 1: Naive */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    Strategy 1: 100% Raw Forecast (Baseline)
                  </span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    £{(simulationResults.naiveCashoutCost / 1_000_000).toFixed(2)}M
                  </span>
                </div>
                <div className="w-full h-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: "100%" }} />
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Volume: {Math.round(simulationResults.naiveVolumeShortMWh).toLocaleString()} MWh settled at peak SBP (£{cashoutPrice}/MWh).
                </div>
              </div>

              {/* Bar 2: Active Strategy */}
              {strategy !== "naive" && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {strategy === "bias_corrected"
                        ? "Strategy 2: Bias-Corrected Hedging"
                        : "Strategy 3: P10 Conservative Buffer"}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      £{(simulationResults.activeCost / 1_000_000).toFixed(2)}M (
                      -£{(simulationResults.activeSavings / 1_000_000).toFixed(2)}M)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(
                          10,
                          (simulationResults.activeCost / simulationResults.naiveCashoutCost) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Pre-contracts {simulationResults.hourlyShortfallMW} MW of Day-Ahead power at £{dayAheadForwardPrice}/MWh, locking in an arbitrage spread of £{cashoutPrice - dayAheadForwardPrice}/MWh over balancing penalties.
                  </div>
                </div>
              )}
            </div>

            {/* Insight Note */}
            <div className="mt-5 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2.5">
              <Shield size={16} className="text-[#c2185b] dark:text-[#f3b9c8] mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Commercial Takeaway:</span>{" "}
                Because the Elexon WINDFOR forecast exhibited a systematic positive bias of +1,840 MW in January 2026, an unhedged utility faces massive cash-out penalties under the BSC balancing mechanism. Pre-hedging with baseload forward contracts eliminates 85%+ of this imbalance volatility.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
