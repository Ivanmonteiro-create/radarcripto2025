import type { AccountBalance, BotConfig, SymbolInfo } from "./domain";

type BuySizingConfig = Pick<BotConfig, "capitalUSDT" | "maxCapitalUSDT" | "maxOrderUSDT" | "strategyParams">;

export function resolveAutomaticBuyUSDT(bot: BuySizingConfig): number {
  const configured = bot.strategyParams.fixedOrderUSDT;
  const requested = configured === undefined || configured === null
    ? bot.capitalUSDT * 0.1
    : Number(configured);
  if (!Number.isFinite(requested) || requested <= 0) throw new Error("Automatic order value must be positive");
  return Math.min(requested, bot.capitalUSDT, bot.maxCapitalUSDT, bot.maxOrderUSDT);
}

export interface AutomaticSpotPreflightInput {
  side: "BUY" | "SELL";
  symbolInfo: SymbolInfo;
  marketPrice: number;
  requestedOrderUSDT: number;
  normalizedQuantity: number;
  balances: AccountBalance[];
}

export function validateAutomaticSpotPreflight(input: AutomaticSpotPreflightInput) {
  const { symbolInfo, marketPrice, normalizedQuantity, requestedOrderUSDT } = input;
  if (!symbolInfo.spotAllowed || symbolInfo.status !== "TRADING") {
    throw new Error(`Spot Testnet symbol ${symbolInfo.symbol} is not trading`);
  }
  const conservativeNotional = normalizedQuantity * marketPrice;
  if (!Number.isFinite(conservativeNotional) || conservativeNotional < symbolInfo.filter.minNotional) {
    throw new Error(`Automatic order is below Testnet min notional ${symbolInfo.filter.minNotional}`);
  }
  if (input.side === "BUY" && requestedOrderUSDT < symbolInfo.filter.minNotional) {
    throw new Error(`Automatic order value is below Testnet min notional ${symbolInfo.filter.minNotional}`);
  }
  const requiredAsset = input.side === "BUY" ? symbolInfo.quoteAsset : symbolInfo.baseAsset;
  const requiredAmount = input.side === "BUY" ? requestedOrderUSDT : normalizedQuantity;
  const balance = input.balances.find((item) => item.asset === requiredAsset);
  if (!balance || balance.free < requiredAmount) {
    throw new Error(`Insufficient Testnet ${requiredAsset} balance for automatic order`);
  }
  return { conservativeNotional, requiredAsset, requiredAmount };
}

export function createRiskRuntimeReset(capitalUSDT: number, now = new Date()) {
  if (!Number.isFinite(capitalUSDT) || capitalUSDT <= 0) throw new Error("Runtime capital must be positive");
  return {
    peakEquity: capitalUSDT,
    dailyRealizedPnl: 0,
    dailyPnlDate: now,
    strategyState: {},
    lastPrice: null,
    lastSignal: null,
    lastSignalReason: null,
    lastOrderAt: null,
    lastError: null,
    consecutiveFailures: 0,
    nextRetryAt: null,
    lastSuccessAt: null,
    workerHeartbeatAt: null,
  };
}
