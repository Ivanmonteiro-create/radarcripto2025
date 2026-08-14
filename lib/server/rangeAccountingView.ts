import {
  calculateCompletedRangeCycle,
  calculateOpenRangePosition,
  summarizeRangeConfiguration,
  summarizeRangeLevel,
  type CompletedRangeCycleAccounting,
  type OpenRangePositionAccounting,
  type RangeAccountingOrder,
} from "@/lib/trading/rangeAccounting";

type Numeric = number | string | { toString(): string } | null | undefined;
type FillRecord = { side: "BUY" | "SELL"; price: Numeric; quantity: Numeric; feeQuote: Numeric };
type OrderRecord = {
  side: "BUY" | "SELL"; type: "MARKET" | "LIMIT"; decisionReason?: string | null;
  decisionTelemetry?: unknown; slippageQuote?: Numeric; simulatedFee?: Numeric; simulatedSlippage?: Numeric;
  fills: FillRecord[];
};
type CycleRecord = {
  id: string; levelId: string; cycleNumber: number; status: string; netPnl: Numeric;
  averageBuyPrice: Numeric; filledQuantity: Numeric; openedAt?: Date | string | null; closedAt?: Date | string | null;
  orders: OrderRecord[];
};
type LevelRecord = { id: string; levelNumber: number; targetPrice: Numeric; cycles: CycleRecord[] };
type ConfigurationRecord = {
  capitalTotal: Numeric; simulatedMakerFeeBps: Numeric; simulatedSlippageBps: Numeric; levels: LevelRecord[];
};

const numeric = (value: Numeric) => Number(value ?? 0);
const telemetry = (value: unknown) => value && typeof value === "object" ? value as Record<string, unknown> : {};

export function accountingOrder(order: OrderRecord): RangeAccountingOrder {
  return {
    side: order.side,
    type: order.type,
    decisionReason: order.decisionReason,
    structuralStop: telemetry(order.decisionTelemetry).structuralStop === true,
    observedSlippage: numeric(order.slippageQuote),
    simulatedFee: numeric(order.simulatedFee),
    simulatedSlippage: numeric(order.simulatedSlippage),
    fills: order.fills.map((fill) => ({
      side: fill.side,
      price: numeric(fill.price),
      quantity: numeric(fill.quantity),
      feeQuote: numeric(fill.feeQuote),
    })),
  };
}

export function buildRangeAccountingView(configuration: ConfigurationRecord, currentPrice: number | null) {
  const cycles: Record<string, (CompletedRangeCycleAccounting & { durationMs: number | null }) | null> = {};
  const levels: Record<string, ReturnType<typeof summarizeRangeLevel> & { open: OpenRangePositionAccounting | null }> = {};

  for (const level of configuration.levels) {
    const completed: CompletedRangeCycleAccounting[] = [];
    let open: OpenRangePositionAccounting | null = null;
    for (const cycle of level.cycles) {
      const orders = cycle.orders.map(accountingOrder);
      if (cycle.status === "COMPLETED") {
        try {
          const metrics = calculateCompletedRangeCycle(orders, numeric(cycle.netPnl));
          completed.push(metrics);
          cycles[cycle.id] = {
            ...metrics,
            durationMs: cycle.openedAt && cycle.closedAt
              ? new Date(cycle.closedAt).getTime() - new Date(cycle.openedAt).getTime()
              : null,
          };
        } catch {
          cycles[cycle.id] = null;
        }
      } else if (cycle.status === "HOLDING" && currentPrice && currentPrice > 0) {
        const buyOrders = orders.filter((order) => order.side === "BUY");
        const buyFills = buyOrders.flatMap((order) => order.fills);
        open = calculateOpenRangePosition({
          entryPrice: numeric(cycle.averageBuyPrice),
          targetPrice: numeric(level.targetPrice),
          quantity: numeric(cycle.filledQuantity),
          currentPrice,
          realEntryFees: buyFills.reduce((total, fill) => total + fill.feeQuote, 0),
          observedEntrySlippage: buyOrders.reduce((total, order) => total + order.observedSlippage, 0),
          simulatedEntryFee: buyOrders.reduce((total, order) => total + order.simulatedFee, 0),
          simulatedEntrySlippage: buyOrders.reduce((total, order) => total + order.simulatedSlippage, 0),
          estimatedRealExitFeeBps: 0,
          simulatedExitFeeBps: numeric(configuration.simulatedMakerFeeBps),
          simulatedExitSlippageBps: numeric(configuration.simulatedSlippageBps),
        });
      }
    }
    levels[level.id] = { ...summarizeRangeLevel(completed, open), open };
  }

  return {
    cycles,
    levels,
    aggregate: summarizeRangeConfiguration(Object.values(levels), numeric(configuration.capitalTotal)),
    convention: {
      realNetPnl: "REAL_FILL_GROSS_MINUS_REAL_FEES",
      observedSlippage: "SIGNED_EXECUTION_QUALITY_ONLY",
      simulatedCosts: "CONFIGURED_LAB_ASSUMPTIONS_ONLY",
    },
  };
}
