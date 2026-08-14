import type { ExchangeMode } from "@/lib/trading/domain";
import { BinanceTestnetExchange } from "@/lib/exchanges/BinanceTestnetExchange";
import type { IExchange } from "@/lib/exchanges/IExchange";
import { SimExchange } from "@/lib/exchanges/SimExchange";
import { getBinanceTestnetConfig, getTradingMode } from "./env";
import { getStoredTestnetConfig } from "./exchangeCredentials";

const simExchanges = new Map<string, SimExchange>();

export async function createExchange(mode: ExchangeMode, botId: string): Promise<IExchange> {
  const environmentMode = getTradingMode();
  if (mode === "TESTNET" && environmentMode !== "TESTNET") {
    throw new Error("TESTNET bot refused because TRADING_MODE is not TESTNET");
  }
  if (mode === "TESTNET") {
    const stored = await getStoredTestnetConfig(botId);
    return new BinanceTestnetExchange(stored ?? getBinanceTestnetConfig());
  }
  const existing = simExchanges.get(botId);
  if (existing) return existing;
  const exchange = new SimExchange();
  simExchanges.set(botId, exchange);
  return exchange;
}
