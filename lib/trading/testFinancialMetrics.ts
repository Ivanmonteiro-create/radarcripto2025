export type FinancialTrade = {
  orderId: string;
  side: "BUY" | "SELL";
  grossPnl: number | null;
  actualNetPnl: number | null;
  realisticNetPnl?: number | null;
  simulatedNetPnl: number | null;
  exchangeFeeActual: number | null;
  simulatedFee: number | null;
  actualSlippage: number | null;
  realisticFee?: number | null;
  realisticSlippage?: number | null;
  simulatedSlippage: number | null;
  decisionReason?: string | null;
  maeQuote?: number | null;
  maeBps?: number | null;
  mfeQuote?: number | null;
  mfeBps?: number | null;
  exitEfficiencyPct?: number | null;
  profitGivebackBps?: number | null;
  totalSimulatedCost?: number | null;
  totalRealisticCost?: number | null;
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function classifyExit(reason?: string | null): "emaCrossover" | "takeProfit" | "stopLoss" | "riskExit" | "manual" | "other" {
  const normalized = (reason ?? "").toLowerCase();
  if (normalized.includes("take-profit")) return "takeProfit";
  if (normalized.includes("stop-loss")) return "stopLoss";
  if (normalized.includes("manual")) return "manual";
  if (normalized.includes("risk") || normalized.includes("kill")) return "riskExit";
  if (normalized.includes("ema")) return "emaCrossover";
  return "other";
}

export function calculateTestFinancialMetrics(trades: FinancialTrade[]) {
  const bySellOrder = new Map<string, FinancialTrade[]>();
  for (const trade of trades.filter((item) => item.side === "SELL")) {
    bySellOrder.set(trade.orderId, [...(bySellOrder.get(trade.orderId) ?? []), trade]);
  }
  const closedTrades = [...bySellOrder.values()].map((items) => ({
    orderId: items[0]!.orderId,
    gross: sum(items.map((item) => item.grossPnl ?? 0)),
    actual: sum(items.map((item) => item.actualNetPnl ?? 0)),
    realistic: sum(items.map((item) => item.realisticNetPnl ?? item.actualNetPnl ?? 0)),
    simulated: sum(items.map((item) => item.simulatedNetPnl ?? 0)),
    exit: classifyExit(items[0]?.decisionReason),
    maeQuote: items.find((item) => item.maeQuote !== null && item.maeQuote !== undefined)?.maeQuote ?? null,
    maeBps: items.find((item) => item.maeBps !== null && item.maeBps !== undefined)?.maeBps ?? null,
    mfeQuote: items.find((item) => item.mfeQuote !== null && item.mfeQuote !== undefined)?.mfeQuote ?? null,
    mfeBps: items.find((item) => item.mfeBps !== null && item.mfeBps !== undefined)?.mfeBps ?? null,
    exitEfficiencyPct: items.find((item) => item.exitEfficiencyPct !== null && item.exitEfficiencyPct !== undefined)?.exitEfficiencyPct ?? null,
    profitGivebackBps: items.find((item) => item.profitGivebackBps !== null && item.profitGivebackBps !== undefined)?.profitGivebackBps ?? null,
    totalSimulatedCost: sum(items.map((item) => item.totalSimulatedCost ?? 0)),
    totalRealisticCost: sum(items.map((item) => item.totalRealisticCost ?? 0)),
  }));
  const strategyMetrics = (key: "realistic" | "simulated") => {
    const wins = closedTrades.filter((trade) => trade[key] > 0).map((trade) => trade[key]);
    const losses = closedTrades.filter((trade) => trade[key] < 0).map((trade) => trade[key]);
    let winStreak = 0; let lossStreak = 0; let maxWinStreak = 0; let maxLossStreak = 0;
    for (const trade of closedTrades) {
      if (trade[key] > 0) { winStreak += 1; lossStreak = 0; }
      else if (trade[key] < 0) { lossStreak += 1; winStreak = 0; }
      else { winStreak = 0; lossStreak = 0; }
      maxWinStreak = Math.max(maxWinStreak, winStreak);
      maxLossStreak = Math.max(maxLossStreak, lossStreak);
    }
    const grossProfit = sum(wins);
    const grossLoss = sum(losses);
    const averageWin = wins.length ? grossProfit / wins.length : 0;
    const averageLoss = losses.length ? grossLoss / losses.length : 0;
    const total = closedTrades.length;
    return {
      closedTrades: total,
      winRatePct: total ? wins.length / total * 100 : 0,
      lossRatePct: total ? losses.length / total * 100 : 0,
      winners: wins.length,
      losers: losses.length,
      breakeven: closedTrades.filter((trade) => trade[key] === 0).length,
      profitFactor: grossLoss < 0 ? grossProfit / Math.abs(grossLoss) : null,
      payoffRatio: averageLoss < 0 ? averageWin / Math.abs(averageLoss) : null,
      expectancy: total ? sum(closedTrades.map((trade) => trade[key])) / total : 0,
      averageWin, averageLoss,
      largestWin: wins.length ? Math.max(...wins) : 0,
      largestLoss: losses.length ? Math.min(...losses) : 0,
      maxWinStreak, maxLossStreak,
    };
  };
  const total = closedTrades.length;
  const excursionTrades = closedTrades.filter((trade) => trade.maeBps !== null && trade.mfeBps !== null);
  const average = (values: number[]) => values.length ? sum(values) / values.length : 0;
  const largestMfeWastedTrade = [...excursionTrades]
    .filter((trade) => trade.profitGivebackBps !== null)
    .sort((left, right) => (right.profitGivebackBps ?? 0) - (left.profitGivebackBps ?? 0))[0] ?? null;
  const topMfeWastedTrades = [...excursionTrades]
    .filter((trade) => trade.profitGivebackBps !== null)
    .sort((left, right) => (right.profitGivebackBps ?? 0) - (left.profitGivebackBps ?? 0))
    .slice(0, 5)
    .map((trade) => ({ orderId: trade.orderId, mfeBps: trade.mfeBps, profitGivebackBps: trade.profitGivebackBps }));
  const exits = { emaCrossover: 0, takeProfit: 0, stopLoss: 0, riskExit: 0, manual: 0, other: 0 };
  for (const trade of closedTrades) exits[trade.exit] += 1;
  return {
    finance: {
      grossPnl: sum(trades.map((trade) => trade.grossPnl ?? 0)),
      exchangeFeeActual: sum(trades.map((trade) => trade.exchangeFeeActual ?? 0)),
      simulatedFee: sum(trades.map((trade) => trade.simulatedFee ?? 0)),
      actualSlippage: sum(trades.map((trade) => trade.actualSlippage ?? 0)),
      realisticFee: sum(trades.map((trade) => trade.realisticFee ?? 0)),
      realisticSlippage: sum(trades.map((trade) => trade.realisticSlippage ?? 0)),
      simulatedSlippage: sum(trades.map((trade) => trade.simulatedSlippage ?? 0)),
      actualNetPnl: sum(trades.map((trade) => trade.actualNetPnl ?? 0)),
      realisticNetPnl: sum(trades.map((trade) => trade.realisticNetPnl ?? trade.actualNetPnl ?? 0)),
      simulatedNetPnl: sum(trades.map((trade) => trade.simulatedNetPnl ?? 0)),
      totalSimulatedCost: sum(trades.map((trade) => trade.simulatedFee ?? 0)) + sum(trades.map((trade) => trade.simulatedSlippage ?? 0)),
      totalRealisticCost: sum(trades.map((trade) => trade.realisticFee ?? 0)) + sum(trades.map((trade) => trade.realisticSlippage ?? 0)),
      totalActualCost: sum(trades.map((trade) => trade.exchangeFeeActual ?? 0)) + sum(trades.map((trade) => trade.actualSlippage ?? 0)),
      averageCostPerTrade: total
        ? (sum(trades.map((trade) => trade.simulatedFee ?? 0)) + sum(trades.map((trade) => trade.simulatedSlippage ?? 0))) / total
        : 0,
      averageRealisticCostPerTrade: total
        ? (sum(trades.map((trade) => trade.realisticFee ?? 0)) + sum(trades.map((trade) => trade.realisticSlippage ?? 0))) / total
        : 0,
    },
    strategy: strategyMetrics("simulated"),
    strategyRealistic: strategyMetrics("realistic"),
    strategyStress: strategyMetrics("simulated"),
    excursions: {
      averageMaeQuote: average(excursionTrades.map((trade) => trade.maeQuote ?? 0)),
      averageMaeBps: average(excursionTrades.map((trade) => trade.maeBps ?? 0)),
      maxMaeQuote: excursionTrades.length ? Math.max(...excursionTrades.map((trade) => trade.maeQuote ?? 0)) : 0,
      maxMaeBps: excursionTrades.length ? Math.max(...excursionTrades.map((trade) => trade.maeBps ?? 0)) : 0,
      averageMfeQuote: average(excursionTrades.map((trade) => trade.mfeQuote ?? 0)),
      averageMfeBps: average(excursionTrades.map((trade) => trade.mfeBps ?? 0)),
      maxMfeQuote: excursionTrades.length ? Math.max(...excursionTrades.map((trade) => trade.mfeQuote ?? 0)) : 0,
      maxMfeBps: excursionTrades.length ? Math.max(...excursionTrades.map((trade) => trade.mfeBps ?? 0)) : 0,
      averageExitEfficiencyPct: average(excursionTrades.flatMap((trade) => trade.exitEfficiencyPct === null ? [] : [trade.exitEfficiencyPct])),
      averageProfitGivebackBps: average(excursionTrades.flatMap((trade) => trade.profitGivebackBps === null ? [] : [trade.profitGivebackBps])),
      largestMfeWastedTrade: largestMfeWastedTrade ? {
        orderId: largestMfeWastedTrade.orderId,
        mfeBps: largestMfeWastedTrade.mfeBps,
        profitGivebackBps: largestMfeWastedTrade.profitGivebackBps,
      } : null,
      topMfeWastedTrades,
    },
    exits,
  };
}

export function calculateStorageMetrics(snapshotRows: number, durationMs: number) {
  const hours = durationMs > 0 ? durationMs / 3_600_000 : 0;
  const estimatedRowsPerDay = hours ? snapshotRows / hours * 24 : 0;
  return {
    balanceSnapshotRows: snapshotRows,
    averageRowsPerHour: hours ? snapshotRows / hours : 0,
    estimatedRowsPerDay,
    estimatedPayloadBytesPerDay: hours ? snapshotRows / hours * 24 * 107.2 : 0,
    baseline24hRows: 8_791_776,
    projectedReductionPct: estimatedRowsPerDay ? (1 - estimatedRowsPerDay / 8_791_776) * 100 : 0,
  };
}
