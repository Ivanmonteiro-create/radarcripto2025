export type RangeAccountingFill = {
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  feeQuote: number;
};

export type RangeAccountingOrder = {
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  decisionReason?: string | null;
  structuralStop?: boolean;
  observedSlippage: number;
  simulatedFee: number;
  simulatedSlippage: number;
  fills: RangeAccountingFill[];
};

export type RangeExitReason = "TARGET" | "STOP" | "MANUAL" | "RISK" | "OTHER";

export type CompletedRangeCycleAccounting = {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  entryValue: number;
  exitValue: number;
  realizedGrossPnl: number;
  realFees: number;
  observedSlippage: number;
  simulatedFee: number;
  simulatedSlippage: number;
  simulatedCost: number;
  realizedNetPnl: number;
  simulatedNetPnl: number;
  exitReason: RangeExitReason;
  legacyNetPnl: number | null;
  legacyDifference: number;
  needsRecomputation: boolean;
};

export type OpenRangePositionAccounting = {
  entryPrice: number;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  unrealizedGrossPnl: number;
  realEntryFees: number;
  estimatedRealExitFee: number;
  unrealizedNetEstimated: number;
  observedEntrySlippage: number;
  simulatedEntryFee: number;
  simulatedEntrySlippage: number;
  simulatedEntryCost: number;
  simulatedExitFee: number;
  simulatedExitSlippage: number;
  simulatedExitCost: number;
  unrealizedSimulatedNet: number;
  distanceToTargetPct: number | null;
};

export type RangeLevelAccounting = {
  realizedGrossPnl: number;
  unrealizedGrossPnl: number;
  totalGrossPnl: number;
  realFees: number;
  observedSlippage: number;
  simulatedFee: number;
  simulatedSlippage: number;
  simulatedCost: number;
  realizedNetPnl: number;
  simulatedNetPnl: number;
  completedCycles: number;
  openPositions: number;
  committedCapital: number;
  currentExposure: number;
};

const EPSILON = 1e-10;
const sum = <T>(items: T[], selector: (item: T) => number) => items.reduce((total, item) => total + selector(item), 0);

function vwap(fills: RangeAccountingFill[]) {
  const quantity = sum(fills, (fill) => fill.quantity);
  return quantity > EPSILON ? sum(fills, (fill) => fill.price * fill.quantity) / quantity : 0;
}

function exitReason(order: RangeAccountingOrder): RangeExitReason {
  const reason = order.decisionReason?.toUpperCase() ?? "";
  if (order.structuralStop || reason.includes("STRUCTURAL STOP") || reason.includes("STOP")) return "STOP";
  if (reason.includes("MANUAL")) return "MANUAL";
  if (reason.includes("RISK") || reason.includes("KILL")) return "RISK";
  if (reason.includes("TARGET") || order.type === "LIMIT") return "TARGET";
  return "OTHER";
}

export function calculateCompletedRangeCycle(
  orders: RangeAccountingOrder[],
  legacyNetPnl: number | null = null,
): CompletedRangeCycleAccounting {
  const buyFills = orders.flatMap((order) => order.fills).filter((fill) => fill.side === "BUY");
  const sellFills = orders.flatMap((order) => order.fills).filter((fill) => fill.side === "SELL");
  const buyQuantity = sum(buyFills, (fill) => fill.quantity);
  const sellQuantity = sum(sellFills, (fill) => fill.quantity);
  const quantity = Math.min(buyQuantity, sellQuantity);
  if (!(quantity > EPSILON) || Math.abs(buyQuantity - sellQuantity) > EPSILON) {
    throw new Error("Completed range cycle requires equal positive BUY and SELL fill quantities");
  }
  const buyPrice = vwap(buyFills);
  const sellPrice = vwap(sellFills);
  const entryValue = buyPrice * quantity;
  const exitValue = sellPrice * quantity;
  const realizedGrossPnl = exitValue - entryValue;
  const realFees = sum([...buyFills, ...sellFills], (fill) => fill.feeQuote);
  const observedSlippage = sum(orders, (order) => order.observedSlippage);
  const simulatedFee = sum(orders, (order) => order.simulatedFee);
  const simulatedSlippage = sum(orders, (order) => order.simulatedSlippage);
  const simulatedCost = simulatedFee + simulatedSlippage;
  const realizedNetPnl = realizedGrossPnl - realFees;
  const simulatedNetPnl = realizedGrossPnl - simulatedCost;
  const sellOrder = orders.find((order) => order.side === "SELL");
  const legacyDifference = legacyNetPnl === null ? 0 : realizedNetPnl - legacyNetPnl;
  return {
    buyPrice,
    sellPrice,
    quantity,
    entryValue,
    exitValue,
    realizedGrossPnl,
    realFees,
    observedSlippage,
    simulatedFee,
    simulatedSlippage,
    simulatedCost,
    realizedNetPnl,
    simulatedNetPnl,
    exitReason: sellOrder ? exitReason(sellOrder) : "OTHER",
    legacyNetPnl,
    legacyDifference,
    needsRecomputation: legacyNetPnl !== null && Math.abs(legacyDifference) > EPSILON,
  };
}

export function calculateOpenRangePosition(input: {
  entryPrice: number;
  targetPrice: number;
  quantity: number;
  currentPrice: number;
  realEntryFees: number;
  observedEntrySlippage: number;
  simulatedEntryFee: number;
  simulatedEntrySlippage: number;
  estimatedRealExitFeeBps?: number;
  simulatedExitFeeBps: number;
  simulatedExitSlippageBps: number;
}): OpenRangePositionAccounting {
  const currentValue = input.currentPrice * input.quantity;
  const unrealizedGrossPnl = (input.currentPrice - input.entryPrice) * input.quantity;
  const estimatedRealExitFee = currentValue * (input.estimatedRealExitFeeBps ?? 0) / 10_000;
  const simulatedEntryCost = input.simulatedEntryFee + input.simulatedEntrySlippage;
  const simulatedExitFee = currentValue * input.simulatedExitFeeBps / 10_000;
  const simulatedExitSlippage = currentValue * input.simulatedExitSlippageBps / 10_000;
  const simulatedExitCost = simulatedExitFee + simulatedExitSlippage;
  return {
    entryPrice: input.entryPrice,
    quantity: input.quantity,
    currentPrice: input.currentPrice,
    currentValue,
    unrealizedGrossPnl,
    realEntryFees: input.realEntryFees,
    estimatedRealExitFee,
    unrealizedNetEstimated: unrealizedGrossPnl - input.realEntryFees - estimatedRealExitFee,
    observedEntrySlippage: input.observedEntrySlippage,
    simulatedEntryFee: input.simulatedEntryFee,
    simulatedEntrySlippage: input.simulatedEntrySlippage,
    simulatedEntryCost,
    simulatedExitFee,
    simulatedExitSlippage,
    simulatedExitCost,
    unrealizedSimulatedNet: unrealizedGrossPnl - simulatedEntryCost - simulatedExitCost,
    distanceToTargetPct: input.currentPrice > 0 ? (input.targetPrice / input.currentPrice - 1) * 100 : null,
  };
}

export function summarizeRangeLevel(
  completed: CompletedRangeCycleAccounting[],
  open: OpenRangePositionAccounting | null,
): RangeLevelAccounting {
  const realizedGrossPnl = sum(completed, (cycle) => cycle.realizedGrossPnl);
  const unrealizedGrossPnl = open?.unrealizedGrossPnl ?? 0;
  return {
    realizedGrossPnl,
    unrealizedGrossPnl,
    totalGrossPnl: realizedGrossPnl + unrealizedGrossPnl,
    realFees: sum(completed, (cycle) => cycle.realFees) + (open?.realEntryFees ?? 0),
    observedSlippage: sum(completed, (cycle) => cycle.observedSlippage) + (open?.observedEntrySlippage ?? 0),
    simulatedFee: sum(completed, (cycle) => cycle.simulatedFee) + (open?.simulatedEntryFee ?? 0),
    simulatedSlippage: sum(completed, (cycle) => cycle.simulatedSlippage) + (open?.simulatedEntrySlippage ?? 0),
    simulatedCost: sum(completed, (cycle) => cycle.simulatedCost) + (open?.simulatedEntryCost ?? 0),
    realizedNetPnl: sum(completed, (cycle) => cycle.realizedNetPnl),
    simulatedNetPnl: sum(completed, (cycle) => cycle.simulatedNetPnl),
    completedCycles: completed.length,
    openPositions: open ? 1 : 0,
    committedCapital: open ? open.entryPrice * open.quantity : 0,
    currentExposure: open?.currentValue ?? 0,
  };
}

export function summarizeRangeConfiguration(levels: RangeLevelAccounting[], capitalTotal: number) {
  const aggregate = levels.reduce<RangeLevelAccounting>((total, level) => ({
    realizedGrossPnl: total.realizedGrossPnl + level.realizedGrossPnl,
    unrealizedGrossPnl: total.unrealizedGrossPnl + level.unrealizedGrossPnl,
    totalGrossPnl: total.totalGrossPnl + level.totalGrossPnl,
    realFees: total.realFees + level.realFees,
    observedSlippage: total.observedSlippage + level.observedSlippage,
    simulatedFee: total.simulatedFee + level.simulatedFee,
    simulatedSlippage: total.simulatedSlippage + level.simulatedSlippage,
    simulatedCost: total.simulatedCost + level.simulatedCost,
    realizedNetPnl: total.realizedNetPnl + level.realizedNetPnl,
    simulatedNetPnl: total.simulatedNetPnl + level.simulatedNetPnl,
    completedCycles: total.completedCycles + level.completedCycles,
    openPositions: total.openPositions + level.openPositions,
    committedCapital: total.committedCapital + level.committedCapital,
    currentExposure: total.currentExposure + level.currentExposure,
  }), {
    realizedGrossPnl: 0, unrealizedGrossPnl: 0, totalGrossPnl: 0, realFees: 0,
    observedSlippage: 0, simulatedFee: 0, simulatedSlippage: 0, simulatedCost: 0,
    realizedNetPnl: 0, simulatedNetPnl: 0, completedCycles: 0, openPositions: 0, committedCapital: 0, currentExposure: 0,
  });
  return { ...aggregate, capitalFree: capitalTotal - aggregate.committedCapital };
}
