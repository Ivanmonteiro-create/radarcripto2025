import { describe, expect, it } from "vitest";
import { reconcileSpotFill } from "@/lib/trading/positionAccounting";

describe("persisted Spot fill reconciliation", () => {
  it("reconciles weighted buys and partial sells deterministically", () => {
    const first = reconcileSpotFill(null, { side: "BUY", quantity: 2, price: 100, feeQuote: 1 });
    const second = reconcileSpotFill(first.position, { side: "BUY", quantity: 1, price: 130, feeQuote: 0.5 });
    expect(second.position?.quantity).toBe(3);
    expect(second.position?.averageEntryPrice).toBe(110);
    expect(second.position?.costBasisQuote).toBe(331.5);
    const partial = reconcileSpotFill(second.position, { side: "SELL", quantity: 1, price: 120, feeQuote: 0.25 });
    expect(partial.position?.quantity).toBe(2);
    expect(partial.position?.averageEntryPrice).toBe(110);
    expect(partial.realizedPnl).toBeCloseTo(9.25);
  });

  it("distinguishes full fill from order submission and refuses oversell", () => {
    const buy = reconcileSpotFill(null, { side: "BUY", quantity: 1, price: 100, feeQuote: 0 });
    expect(() => reconcileSpotFill(buy.position, { side: "SELL", quantity: 2, price: 100, feeQuote: 0 })).toThrow(/oversell/i);
    const closed = reconcileSpotFill(buy.position, { side: "SELL", quantity: 1, price: 105, feeQuote: 0 });
    expect(closed.position).toBeNull();
    expect(closed.realizedPnl).toBe(5);
  });
});
