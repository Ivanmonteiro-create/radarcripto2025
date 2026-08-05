import { describe, expect, it } from "vitest";
import { SimulationEngine } from "@/lib/trading/simulationEngine";

describe("SimulationEngine Spot accounting", () => {
  it("buys Spot, reduces USDT, and calculates average entry", () => {
    const engine = new SimulationEngine({ initialCashUSDT: 1_000, feeRate: 0 });
    engine.createMarketOrder({ symbol: "BTCUSDT", side: "BUY", quantity: 2, marketPrice: 100 });
    engine.createMarketOrder({ symbol: "BTCUSDT", side: "BUY", quantity: 1, marketPrice: 130 });
    const snapshot = engine.snapshot();
    expect(snapshot.cash).toBe(670);
    expect(snapshot.positions[0].quantity).toBe(3);
    expect(snapshot.positions[0].averageEntryPrice).toBe(110);
    expect(snapshot.equity).toBe(1_060);
  });

  it("rejects Spot shorts and oversells", () => {
    const engine = new SimulationEngine({ feeRate: 0 });
    expect(() => engine.createMarketOrder({ symbol: "BTCUSDT", side: "SELL", quantity: 1, marketPrice: 100 })).toThrow(/cannot sell/i);
    engine.createMarketOrder({ symbol: "BTCUSDT", side: "BUY", quantity: 1, marketPrice: 100 });
    expect(() => engine.createMarketOrder({ symbol: "BTCUSDT", side: "SELL", quantity: 2, marketPrice: 100 })).toThrow(/cannot sell/i);
  });

  it("closes partially without changing average entry", () => {
    const engine = new SimulationEngine({ initialCashUSDT: 1_000, feeRate: 0 });
    engine.createMarketOrder({ symbol: "BTCUSDT", side: "BUY", quantity: 1, marketPrice: 100 });
    engine.createMarketOrder({ symbol: "BTCUSDT", side: "SELL", quantity: 0.4, marketPrice: 120 });
    const snapshot = engine.snapshot();
    expect(snapshot.positions[0].quantity).toBeCloseTo(0.6);
    expect(snapshot.positions[0].averageEntryPrice).toBe(100);
    expect(snapshot.realizedPnl).toBe(8);
    expect(snapshot.unrealizedPnl).toBe(12);
    expect(snapshot.equity).toBe(1_020);
  });

  it("closes a position completely and separates realized PNL", () => {
    const engine = new SimulationEngine({ initialCashUSDT: 1_000, feeRate: 0 });
    engine.createMarketOrder({ symbol: "ETHUSDT", side: "BUY", quantity: 2, marketPrice: 100 });
    engine.createMarketOrder({ symbol: "ETHUSDT", side: "SELL", quantity: 2, marketPrice: 125 });
    const snapshot = engine.snapshot();
    expect(snapshot.positions).toHaveLength(0);
    expect(snapshot.cash).toBe(1_050);
    expect(snapshot.realizedPnl).toBe(50);
    expect(snapshot.unrealizedPnl).toBe(0);
    expect(snapshot.equity).toBe(1_050);
  });

  it("applies buy and sell fees to PNL and equity", () => {
    const engine = new SimulationEngine({ initialCashUSDT: 1_000, feeRate: 0.01 });
    engine.createMarketOrder({ symbol: "SOLUSDT", side: "BUY", quantity: 1, marketPrice: 100 });
    expect(engine.snapshot().equity).toBe(999);
    expect(engine.snapshot().unrealizedPnl).toBe(-1);
    engine.createMarketOrder({ symbol: "SOLUSDT", side: "SELL", quantity: 1, marketPrice: 110 });
    expect(engine.snapshot().realizedPnl).toBeCloseTo(7.9);
    expect(engine.snapshot().equity).toBeCloseTo(1_007.9);
  });

  it("applies adverse configurable slippage", () => {
    const engine = new SimulationEngine({ initialCashUSDT: 1_000, feeRate: 0, slippageBps: 100 });
    const buy = engine.createMarketOrder({ symbol: "ADAUSDT", side: "BUY", quantity: 1, marketPrice: 100 });
    expect(buy.averageFillPrice).toBe(101);
    const sell = engine.createMarketOrder({ symbol: "ADAUSDT", side: "SELL", quantity: 1, marketPrice: 100 });
    expect(sell.averageFillPrice).toBe(99);
    expect(engine.snapshot().realizedPnl).toBe(-2);
  });

  it("closes exactly the full quantity on TP and SL", () => {
    const tpEngine = new SimulationEngine({ feeRate: 0 });
    tpEngine.createMarketOrder({ symbol: "BTCUSDT", side: "BUY", quantity: 1.2345, marketPrice: 100 });
    expect(tpEngine.evaluateExit("BTCUSDT", 109, { takeProfitPrice: 110 })).toBeNull();
    expect(tpEngine.evaluateExit("BTCUSDT", 110, { takeProfitPrice: 110 })?.status).toBe("FILLED");
    expect(tpEngine.snapshot().positions).toHaveLength(0);

    const slEngine = new SimulationEngine({ feeRate: 0 });
    slEngine.createMarketOrder({ symbol: "BTCUSDT", side: "BUY", quantity: 0.75, marketPrice: 100 });
    expect(slEngine.evaluateExit("BTCUSDT", 90, { stopLossPrice: 90 })?.executedQuantity).toBe(0.75);
    expect(slEngine.snapshot().positions).toHaveLength(0);
  });

  it("marks each position only with its own symbol price", () => {
    const engine = new SimulationEngine({ feeRate: 0 });
    engine.createMarketOrder({ symbol: "BTCUSDT", side: "BUY", quantity: 1, marketPrice: 100 });
    engine.setMarketPrice("DOGEUSDT", 1_000);
    expect(engine.getPosition("BTCUSDT")?.unrealizedPnl).toBe(0);
    engine.setMarketPrice("BTCUSDT", 105);
    expect(engine.getPosition("BTCUSDT")?.unrealizedPnl).toBe(5);
  });
});
