import { createHmac } from "node:crypto";
import type { AccountBalance, Fill, Order, OrderStatus, SymbolInfo, Trade } from "@/lib/trading/domain";
import { normalizeSymbol } from "@/lib/trading/domain";
import type {
  ExchangeOrderResult,
  IExchange,
  LimitOrderRequest,
  MarketOrderRequest,
} from "./IExchange";

const TESTNET_HOSTS = new Set(["testnet.binance.vision"]);

interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  receiveWindow?: number;
}

type BinanceFilter = { filterType: string; minPrice?: string; maxPrice?: string; tickSize?: string; minQty?: string; maxQty?: string; stepSize?: string; minNotional?: string };
type BinanceOrder = Record<string, unknown> & { orderId: number; clientOrderId: string; symbol: string; side: "BUY" | "SELL"; type: "MARKET" | "LIMIT"; status: string; origQty: string; executedQty: string; cummulativeQuoteQty?: string; price?: string; transactTime?: number; updateTime?: number; fills?: Array<{ price: string; qty: string; commission: string; commissionAsset: string }> };

export interface BinanceReadOnlyValidation {
  serverTime: number;
  symbol: SymbolInfo;
  nonZeroBalanceCount: number;
  openOrderCount: number;
}

export class BinanceTestnetExchange implements IExchange {
  readonly mode = "TESTNET" as const;
  private readonly baseUrl: string;
  private readonly receiveWindow: number;
  private timeOffsetMs = 0;
  private lastTimeSync = 0;

  constructor(private readonly config: BinanceConfig) {
    if (typeof window !== "undefined") throw new Error("BinanceTestnetExchange is server-only");
    this.baseUrl = (config.baseUrl || "https://testnet.binance.vision").replace(/\/$/, "");
    const parsed = new URL(this.baseUrl);
    if (parsed.protocol !== "https:" || !TESTNET_HOSTS.has(parsed.hostname)) {
      throw new Error("Binance adapter refused a non-Testnet endpoint");
    }
    if (!config.apiKey || !config.apiSecret) throw new Error("Binance Testnet credentials are required");
    this.receiveWindow = config.receiveWindow ?? 5_000;
  }

  async getAccountBalances(): Promise<AccountBalance[]> {
    const data = await this.signedRequest<{ balances: Array<{ asset: string; free: string; locked: string }> }>("GET", "/api/v3/account");
    return data.balances.map((balance) => ({ asset: balance.asset, free: Number(balance.free), locked: Number(balance.locked) }));
  }

  async getSymbolInfo(symbol: string): Promise<SymbolInfo> {
    const normalized = normalizeSymbol(symbol);
    const data = await this.publicRequest<{ symbols: Array<{ symbol: string; status: string; baseAsset: string; quoteAsset: string; isSpotTradingAllowed: boolean; filters: BinanceFilter[] }> }>(`/api/v3/exchangeInfo?symbol=${normalized}`);
    const item = data.symbols[0];
    if (!item || !item.isSpotTradingAllowed || item.quoteAsset !== "USDT") throw new Error(`Symbol ${normalized} is not available for Spot Testnet`);
    const price = item.filters.find((filter) => filter.filterType === "PRICE_FILTER");
    const lot = item.filters.find((filter) => filter.filterType === "LOT_SIZE");
    const notional = item.filters.find((filter) => filter.filterType === "MIN_NOTIONAL" || filter.filterType === "NOTIONAL");
    if (!price || !lot || !notional) throw new Error(`Required Binance filters missing for ${normalized}`);
    return {
      symbol: normalized,
      status: item.status,
      baseAsset: item.baseAsset,
      quoteAsset: item.quoteAsset,
      spotAllowed: item.isSpotTradingAllowed,
      filter: {
        minPrice: Number(price.minPrice), maxPrice: Number(price.maxPrice), tickSize: Number(price.tickSize),
        minQuantity: Number(lot.minQty), maxQuantity: Number(lot.maxQty), stepSize: Number(lot.stepSize),
        minNotional: Number(notional.minNotional),
      },
    };
  }

  async getTickerPrice(symbol: string): Promise<number> {
    const data = await this.publicRequest<{ price: string }>(`/api/v3/ticker/price?symbol=${normalizeSymbol(symbol)}`);
    return Number(data.price);
  }

  async createMarketOrder(request: MarketOrderRequest): Promise<ExchangeOrderResult> {
    const quantity = request.quantity === undefined ? undefined : await this.normalizeQuantity(request.symbol, request.quantity);
    const params: Record<string, string | number> = {
      symbol: normalizeSymbol(request.symbol), side: request.side, type: "MARKET",
      newClientOrderId: request.clientOrderId, newOrderRespType: "FULL",
    };
    if (quantity !== undefined) params.quantity = quantity;
    else if (request.side === "BUY" && request.quoteOrderQty !== undefined) params.quoteOrderQty = request.quoteOrderQty;
    else throw new Error("Testnet market order requires quantity, or quoteOrderQty for BUY");
    await this.validateNotional(request.symbol, quantity, request.quoteOrderQty);
    return this.mapOrder(await this.signedRequest<BinanceOrder>("POST", "/api/v3/order", params));
  }

  async createLimitOrder(request: LimitOrderRequest): Promise<ExchangeOrderResult> {
    const quantity = await this.normalizeQuantity(request.symbol, request.quantity);
    const price = await this.normalizePrice(request.symbol, request.price);
    await this.validateNotional(request.symbol, quantity, quantity * price);
    return this.mapOrder(await this.signedRequest<BinanceOrder>("POST", "/api/v3/order", {
      symbol: normalizeSymbol(request.symbol), side: request.side, type: "LIMIT", timeInForce: "GTC",
      quantity, price, newClientOrderId: request.clientOrderId, newOrderRespType: "FULL",
    }));
  }

  async getOrder(symbol: string, reference: { orderId?: string; clientOrderId?: string }): Promise<Order> {
    if (!reference.orderId && !reference.clientOrderId) throw new Error("Order reference is required");
    const raw = await this.signedRequest<BinanceOrder>("GET", "/api/v3/order", {
      symbol: normalizeSymbol(symbol),
      ...(reference.orderId ? { orderId: reference.orderId } : { origClientOrderId: reference.clientOrderId! }),
    });
    return this.mapOrder(raw).order;
  }

  async validateReadOnly(symbol = "BTCUSDT"): Promise<BinanceReadOnlyValidation> {
    const [serverTime, symbolInfo, balances, openOrders] = await Promise.all([
      this.getServerTime(),
      this.getSymbolInfo(symbol),
      this.getAccountBalances(),
      this.getOpenOrders(symbol),
    ]);
    return {
      serverTime,
      symbol: symbolInfo,
      nonZeroBalanceCount: balances.filter((balance) => balance.free + balance.locked > 0).length,
      openOrderCount: openOrders.length,
    };
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    const raw = await this.signedRequest<BinanceOrder[]>("GET", "/api/v3/openOrders", symbol ? { symbol: normalizeSymbol(symbol) } : {});
    return raw.map((item) => this.mapOrder(item).order);
  }

  async cancelOrder(symbol: string, orderId: string): Promise<Order> {
    const raw = await this.signedRequest<BinanceOrder>("DELETE", "/api/v3/order", { symbol: normalizeSymbol(symbol), orderId });
    return this.mapOrder(raw).order;
  }

  async getRecentTrades(symbol: string, limit = 50): Promise<Trade[]> {
    const raw = await this.signedRequest<Array<Record<string, unknown>>>("GET", "/api/v3/myTrades", { symbol: normalizeSymbol(symbol), limit: Math.min(limit, 1000) });
    return raw.map((item) => ({
      id: String(item.id), orderId: String(item.orderId), symbol: String(item.symbol),
      side: item.isBuyer ? "BUY" : "SELL", price: Number(item.price), quantity: Number(item.qty),
      notionalQuote: Number(item.quoteQty),
      feeQuote: String(item.commissionAsset) === "USDT" ? Number(item.commission) : 0,
      feeAsset: String(item.commissionAsset), feeAmount: Number(item.commission), realizedPnl: 0,
      timestamp: Number(item.time),
    }));
  }

  async normalizeQuantity(symbol: string, quantity: number): Promise<number> {
    const info = await this.getSymbolInfo(symbol);
    const normalized = this.floorToStep(quantity, info.filter.stepSize);
    if (normalized < info.filter.minQuantity || normalized > info.filter.maxQuantity) {
      throw new Error(`Quantity violates Testnet LOT_SIZE for ${info.symbol}`);
    }
    return normalized;
  }

  async normalizePrice(symbol: string, price: number): Promise<number> {
    const info = await this.getSymbolInfo(symbol);
    const normalized = this.floorToStep(price, info.filter.tickSize);
    if (normalized < info.filter.minPrice || normalized > info.filter.maxPrice) {
      throw new Error(`Price violates Testnet PRICE_FILTER for ${info.symbol}`);
    }
    return normalized;
  }

  private async validateNotional(symbol: string, quantity?: number, suppliedNotional?: number): Promise<void> {
    const info = await this.getSymbolInfo(symbol);
    const notional = suppliedNotional ?? (quantity ?? 0) * await this.getTickerPrice(symbol);
    if (notional < info.filter.minNotional) throw new Error(`Order is below Testnet min notional ${info.filter.minNotional}`);
  }

  private async syncTime(): Promise<void> {
    if (Date.now() - this.lastTimeSync < 60_000) return;
    const started = Date.now();
    const data = await this.publicRequest<{ serverTime: number }>("/api/v3/time");
    const ended = Date.now();
    this.timeOffsetMs = data.serverTime - Math.floor((started + ended) / 2);
    this.lastTimeSync = ended;
  }

  async getServerTime(): Promise<number> {
    const data = await this.publicRequest<{ serverTime: number }>("/api/v3/time");
    if (!Number.isFinite(data.serverTime)) throw new Error("Invalid Binance Testnet server time");
    return data.serverTime;
  }

  private async publicRequest<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    return this.parseResponse<T>(response);
  }

  private async signedRequest<T>(method: string, path: string, params: Record<string, string | number> = {}): Promise<T> {
    await this.syncTime();
    const query = new URLSearchParams({
      ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
      recvWindow: String(this.receiveWindow),
      timestamp: String(Date.now() + this.timeOffsetMs),
    });
    const signature = createHmac("sha256", this.config.apiSecret).update(query.toString()).digest("hex");
    query.set("signature", signature);
    const response = await fetch(`${this.baseUrl}${path}?${query}`, {
      method,
      headers: { "X-MBX-APIKEY": this.config.apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(`Binance Testnet rejected request (${response.status}, code ${String(payload.code ?? "unknown")})`);
    return payload as T;
  }

  private mapOrder(raw: BinanceOrder): ExchangeOrderResult {
    const timestamp = Number(raw.updateTime ?? raw.transactTime ?? Date.now());
    const fills: Fill[] = (raw.fills ?? []).map((fill, index) => ({
      id: `${raw.orderId}-${index}`, orderId: String(raw.orderId), symbol: raw.symbol, side: raw.side,
      price: Number(fill.price), quantity: Number(fill.qty),
      feeQuote: fill.commissionAsset === "USDT" ? Number(fill.commission) : 0,
      feeAsset: fill.commissionAsset, feeAmount: Number(fill.commission), timestamp,
    }));
    const executedQuantity = Number(raw.executedQty);
    const totalQuote = Number(raw.cummulativeQuoteQty ?? 0) || fills.reduce((sum, fill) => sum + fill.price * fill.quantity, 0);
    return {
      order: {
        id: String(raw.orderId), exchangeOrderId: String(raw.orderId), clientOrderId: raw.clientOrderId,
        symbol: raw.symbol, side: raw.side, type: raw.type, status: this.mapStatus(raw.status),
        requestedQuantity: Number(raw.origQty), executedQuantity,
        requestedPrice: raw.price ? Number(raw.price) : undefined,
        averageFillPrice: executedQuantity ? totalQuote / executedQuantity : undefined,
        createdAt: Number(raw.transactTime ?? timestamp), updatedAt: timestamp,
      },
      fills,
    };
  }

  private mapStatus(status: string): OrderStatus {
    const values: Record<string, OrderStatus> = {
      NEW: "OPEN", PARTIALLY_FILLED: "PARTIALLY_FILLED", FILLED: "FILLED",
      CANCELED: "CANCELLED", PENDING_CANCEL: "PENDING", REJECTED: "REJECTED", EXPIRED: "CANCELLED",
    };
    return values[status] ?? "PENDING";
  }

  private floorToStep(value: number, step: number): number {
    if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(step) || step <= 0) throw new Error("Invalid normalization input");
    const precision = Math.max(0, (step.toString().split(".")[1] ?? "").length);
    return Number((Math.floor((value + Number.EPSILON) / step) * step).toFixed(precision));
  }
}
