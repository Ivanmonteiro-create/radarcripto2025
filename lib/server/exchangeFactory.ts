import type { ExchangeMode } from "@/lib/trading/domain";
import { BinanceTestnetExchange } from "@/lib/exchanges/BinanceTestnetExchange";
import type { IExchange } from "@/lib/exchanges/IExchange";
import { SimExchange } from "@/lib/exchanges/SimExchange";
import { getBinanceTestnetConfig, getTradingMode } from "./env";

const simExchanges = new Map<string, SimExchange>();

export function createExchange(mode: ExchangeMode, botId: string): IExchange {
  const environmentMode = getTradingMode();
  if (mode === "TESTNET" && environmentMode !== "TESTNET") {
    throw new Error("TESTNET bot refused because TRADING_MODE is not TESTNET");
  }
  if (mode === "TESTNET") return new BinanceTestnetExchange(getBinanceTestnetConfig());
  const existing = simExchanges.get(botId);
  if (existing) return existing;
  const exchange = new SimExchange();
  simExchanges.set(botId, exchange);
  return exchange;
}
