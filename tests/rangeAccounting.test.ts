import { describe, expect, it } from "vitest";
import {
  calculateCompletedRangeCycle,
  calculateOpenRangePosition,
  summarizeRangeConfiguration,
  summarizeRangeLevel,
  type RangeAccountingOrder,
} from "@/lib/trading/rangeAccounting";
import { rangeLabel } from "@/lib/trading/rangeLabels";

const order = (overrides: Partial<RangeAccountingOrder> & Pick<RangeAccountingOrder, "side">): RangeAccountingOrder => ({
  type: "LIMIT",
  decisionReason: overrides.side === "SELL" ? "Strategy B target" : "Strategy B entry",
  observedSlippage: 0,
  simulatedFee: 0,
  simulatedSlippage: 0,
  fills: [],
  ...overrides,
});

const cycle = (input: {
  buy: number; sell: number; quantity?: number; buySlip?: number; sellSlip?: number;
  buyFee?: number; sellFee?: number; simulatedFee?: number; simulatedSlip?: number;
  stop?: boolean; legacy?: number | null;
}) => {
  const quantity = input.quantity ?? 0.00009;
  return calculateCompletedRangeCycle([
    order({
      side: "BUY", observedSlippage: input.buySlip ?? 0,
      simulatedFee: input.simulatedFee ?? 0, simulatedSlippage: input.simulatedSlip ?? 0,
      fills: [{ side: "BUY", price: input.buy, quantity, feeQuote: input.buyFee ?? 0 }],
    }),
    order({
      side: "SELL", type: input.stop ? "MARKET" : "LIMIT", structuralStop: input.stop,
      decisionReason: input.stop ? "Strategy B structural stop" : "Strategy B target",
      observedSlippage: input.sellSlip ?? 0,
      simulatedFee: input.simulatedFee ?? 0, simulatedSlippage: input.simulatedSlip ?? 0,
      fills: [{ side: "SELL", price: input.sell, quantity, feeQuote: input.sellFee ?? 0 }],
    }),
  ], input.legacy ?? null);
};

describe("Strategy B corrected accounting", () => {
  it("does not subtract favorable or adverse observed slippage from real fill PNL", () => {
    const favorable = cycle({ buy: 100, sell: 110, quantity: 1, buySlip: -2, sellSlip: -1 });
    const adverse = cycle({ buy: 100, sell: 110, quantity: 1, buySlip: 2, sellSlip: 3 });
    expect(favorable.observedSlippage).toBe(-3);
    expect(adverse.observedSlippage).toBe(5);
    expect(favorable.realizedNetPnl).toBe(10);
    expect(adverse.realizedNetPnl).toBe(10);
  });

  it("supports zero and non-zero real fees independently from simulated costs", () => {
    expect(cycle({ buy: 100, sell: 110, quantity: 1 }).realizedNetPnl).toBe(10);
    const paid = cycle({ buy: 100, sell: 110, quantity: 1, buyFee: 0.2, sellFee: 0.3, simulatedFee: 1, simulatedSlip: 0.5 });
    expect(paid.realFees).toBeCloseTo(0.5);
    expect(paid.realizedNetPnl).toBeCloseTo(9.5);
    expect(paid.simulatedCost).toBe(3);
    expect(paid.simulatedNetPnl).toBe(7);
  });

  it("classifies target and structural-stop exits without changing execution rules", () => {
    expect(cycle({ buy: 100, sell: 101 }).exitReason).toBe("TARGET");
    expect(cycle({ buy: 100, sell: 90, stop: true }).exitReason).toBe("STOP");
  });

  it("calculates an open position separately from realized cycles", () => {
    const open = calculateOpenRangePosition({
      entryPrice: 100, targetPrice: 105, quantity: 1, currentPrice: 102,
      realEntryFees: 0.1, observedEntrySlippage: -0.2,
      simulatedEntryFee: 0.5, simulatedEntrySlippage: 0.25,
      estimatedRealExitFeeBps: 10, simulatedExitFeeBps: 10, simulatedExitSlippageBps: 5,
    });
    expect(open.unrealizedGrossPnl).toBe(2);
    expect(open.unrealizedNetEstimated).toBeCloseTo(1.798);
    expect(open.unrealizedSimulatedNet).toBeCloseTo(1.097);
    expect(open.observedEntrySlippage).toBe(-0.2);
  });

  it("accumulates levels and configuration without mixing realized and unrealized PNL", () => {
    const completed = cycle({ buy: 100, sell: 110, quantity: 1, simulatedFee: 1, simulatedSlip: 0.5 });
    const open = calculateOpenRangePosition({
      entryPrice: 100, targetPrice: 110, quantity: 1, currentPrice: 105,
      realEntryFees: 0, observedEntrySlippage: 0, simulatedEntryFee: 1, simulatedEntrySlippage: 0.5,
      simulatedExitFeeBps: 10, simulatedExitSlippageBps: 5,
    });
    const level = summarizeRangeLevel([completed], open);
    const aggregate = summarizeRangeConfiguration([level], 30);
    expect(level.realizedGrossPnl).toBe(10);
    expect(level.unrealizedGrossPnl).toBe(5);
    expect(level.totalGrossPnl).toBe(15);
    expect(aggregate.completedCycles).toBe(1);
    expect(aggregate.openPositions).toBe(1);
    expect(aggregate.committedCapital).toBe(100);
    expect(aggregate.capitalFree).toBe(-70);
  });

  it("marks deterministic legacy differences for safe recomputation", () => {
    const result = cycle({ buy: 100, sell: 110, quantity: 1, buySlip: 2, legacy: 8 });
    expect(result.realizedNetPnl).toBe(10);
    expect(result.legacyDifference).toBe(2);
    expect(result.needsRecomputation).toBe(true);
  });

  it.each([
    ["N1/C1", 63246.69, 60290.11, -0.2660922],
    ["N2/C1", 63183.38, 60208.11, -0.2677743],
    ["N3/C1", 63120.07, 60344.77, -0.249777],
    ["N3/C2", 62869.66, 63215.57, 0.0311319],
    ["N3/C3", 63120.07, 63215.81, 0.0086166],
  ])("reproduces audited %s from real fills", (_name, buy, sell, expected) => {
    expect(cycle({ buy, sell }).realizedNetPnl).toBeCloseTo(expected, 9);
  });

  it("localizes technical enums in PT, EN, and ES", () => {
    expect(rangeLabel("WAITING_SELL", "pt")).toBe("Aguardando preço de venda");
    expect(rangeLabel("WAITING_SELL", "en")).toBe("Waiting for sell price");
    expect(rangeLabel("WAITING_SELL", "es")).toBe("Esperando precio de venta");
    expect(rangeLabel("ARCHIVED", "pt")).toBe("Arquivado");
  });
});
