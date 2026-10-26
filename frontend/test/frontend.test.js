import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Frontend Data & Formatting Logic', () => {
  test('formats numbers and handles null values gracefully', () => {
    const formatMW = (val) => (val != null ? `${Number(val).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MW` : '—');
    assert.equal(formatMW(2107.18), '2,107.2 MW');
    assert.equal(formatMW(null), '—');
    assert.equal(formatMW(undefined), '—');
  });

  test('correctly classifies over-forecasting vs under-forecasting bias', () => {
    const classifyBias = (bias) => {
      if (bias == null) return 'NO_DATA';
      return bias > 0 ? 'OVER_FORECAST_SHORT_RISK' : 'UNDER_FORECAST_SPILL_RISK';
    };

    assert.equal(classifyBias(1839.9), 'OVER_FORECAST_SHORT_RISK');
    assert.equal(classifyBias(-450.2), 'UNDER_FORECAST_SPILL_RISK');
    assert.equal(classifyBias(null), 'NO_DATA');
  });

  test('validates Day-Ahead cutoff gate constraints', () => {
    const isValidGate = (hour) => typeof hour === 'number' && hour >= 0 && hour <= 23;
    assert.equal(isValidGate(11), true);
    assert.equal(isValidGate(9), true);
    assert.equal(isValidGate(24), false);
    assert.equal(isValidGate(-1), false);
  });

  test('validates January 2026 date bounds', () => {
    const isWithinJan2026 = (dateStr) => {
      return dateStr >= '2026-01-01' && dateStr <= '2026-01-31';
    };

    assert.equal(isWithinJan2026('2026-01-01'), true);
    assert.equal(isWithinJan2026('2026-01-15'), true);
    assert.equal(isWithinJan2026('2026-01-31'), true);
    assert.equal(isWithinJan2026('2025-12-31'), false);
    assert.equal(isWithinJan2026('2026-02-01'), false);
  });

  test('calculates lead time from startTime and publishTime', () => {
    const calcLeadTimeHours = (startTimeStr, publishTimeStr) => {
      const st = new Date(startTimeStr);
      const pt = new Date(publishTimeStr);
      return Math.round(((st - pt) / (1000 * 3600)) * 100) / 100;
    };

    // Jan 2 14:00 delivery, Jan 1 09:30 publish -> 28.5 hours
    const leadTime = calcLeadTimeHours('2026-01-02T14:00:00Z', '2026-01-01T09:30:00Z');
    assert.equal(leadTime, 28.5);
  });

  test('computes procurement imbalance and cash-out cost avoidance', () => {
    const portfolioWindMW = 2000;
    const hours = 744;
    const cashoutPrice = 120; // £/MWh
    const forwardPrice = 80; // £/MWh
    const biasRatio = 1840 / 13340; // ~13.79% over-forecast

    const shortfallMW = portfolioWindMW * biasRatio;
    const naiveCashoutCost = shortfallMW * hours * cashoutPrice;
    assert.ok(naiveCashoutCost > 0);

    // Forward hedge replaces expensive cashout with forward price for 85% of shortfall
    const daForwardCost = shortfallMW * hours * forwardPrice;
    const remainingCashout = shortfallMW * hours * 0.15 * cashoutPrice;
    const hedgedTotalCost = daForwardCost + remainingCashout;
    const savings = naiveCashoutCost - hedgedTotalCost;

    assert.ok(savings > 0);
    assert.ok(hedgedTotalCost < naiveCashoutCost);
  });

  test('validates delivery hours conversion from settlement observation count', () => {
    const calcDeliveryHours = (obsCount, resolution) => {
      const intervalDuration = resolution === 'half_hourly' ? 0.5 : 1.0;
      return obsCount * intervalDuration;
    };

    // 1488 half-hourly settlement periods = 744 delivery hours
    assert.equal(calcDeliveryHours(1488, 'half_hourly'), 744);
    // 744 hourly intervals = 744 delivery hours
    assert.equal(calcDeliveryHours(744, 'hourly_aggregated'), 744);
  });

  test('calculates energy imbalance volume in GWh consistently', () => {
    const calcImbalanceGWh = (biasMW, totalDeliveryHours) => {
      return Math.round((Math.abs(biasMW) * totalDeliveryHours) / 1000);
    };

    // +1,840.3 MW bias across 744 delivery hours = 1,369 GWh shortfall
    assert.equal(calcImbalanceGWh(1840.3, 744), 1369);
  });
});

