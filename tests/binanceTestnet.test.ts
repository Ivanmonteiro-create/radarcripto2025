import { describe, expect, it } from "vitest";
import { BinanceTestnetExchange } from "@/lib/exchanges/BinanceTestnetExchange";

describe("BinanceTestnetExchange safety boundary", () => {
  it("refuses Binance Live endpoints", () => {
    expect(() => new BinanceTestnetExchange({ apiKey: "test", apiSecret: "test", baseUrl: "https://api.binance.com" })).toThrow(/non-Testnet/i);
  });

  it("accepts only the explicit Spot Testnet host without making a request", () => {
    const exchange = new BinanceTestnetExchange({ apiKey: "test", apiSecret: "test", baseUrl: "https://testnet.binance.vision" });
    expect(exchange.mode).toBe("TESTNET");
  });
});
