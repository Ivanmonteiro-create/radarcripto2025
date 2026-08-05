import type { AccountBalance, Order, SymbolInfo, Trade } from "@/lib/trading/domain";
import { normalizeSymbol } from "@/lib/trading/domain";
import { SimulationEngine, type SimulationOptions } from "@/lib/trading/simulationEngine";
import type {
  ExchangeOrderResult,
  IExchange,
  LimitOrderRequest,
  MarketOrderRequest,
} from "./IExchange";

const defaultFilter = {
  minPrice: 0.00000001,
  maxPrice: 100_000_000,
  tickSize: 0.00000001,
  minQuantity: 0.00000001,
  maxQuantity: 1_000_000_000,
  stepSize: 0.00000001,
  minNotional: 1,
};

export class SimExchange implements IExchange {
  readonly mode = "SIM" as const;
  readonly engine: SimulationEngine;
  private readonly prices = new Map<string, number>();

  constructor(options: SimulationOptions = {}) {
    this.engine = new SimulationEngine(options);
  }

  setTickerPrice(symbol: string, price: number): void {
    const normalized = normalizeSymbol(symbol);
    this.prices.set(normalized, price);
    this.engine.setMarketPrice(normalized, price);
  }

  async getAccountBalances(): Promise<AccountBalance[]> {
    const snapshot = this.engine.snapshot();
    const balances: AccountBalance[] = [{ asset: "USDT", free: snapshot.cash, locked: 0 }];
    for (const position of snapshot.positions) {
      balances.push({ asset: position.symbol.replace(/USDT$/, ""), free: position.quantity, locked: 0 });
    }
    return balances;
  }

  async getSymbolInfo(symbol: string): Promise<SymbolInfo> {
    const normalized = normalizeSymbol(symbol);
    return {
      symbol: normalized,
      status: "TRADING",
      baseAsset: normalized.replace(/USDT$/, ""),
      quoteAsset: "USDT",
      spotAllowed: true,
      filter: defaultFilter,
    };
  }

  async getTickerPrice(symbol: string): Promise<number> {
    const price = this.prices.get(normalizeSymbol(symbol));
    if (!price) throw new Error(`No simulated ticker price for ${symbol}`);
    return price;
  }

  async createMarketOrder(request: MarketOrderRequest): Promise<ExchangeOrderResult> {
    const price = await this.getTickerPrice(request.symbol);
    const order = this.engine.createMarketOrder({
      symbol: request.symbol,
      side: request.side,
      marketPrice: price,
      quantity: request.quantity,
      notionalUSDT: request.quoteOrderQty,
      clientOrderId: request.clientOrderId,
    });
    const fill = this.engine.snapshot().fills.filter((item) => item.orderId === order.id);
    return { order, fills: fill };
  }

  async createLimitOrder(request: LimitOrderRequest): Promise<ExchangeOrderResult> {
    const current = await this.getTickerPrice(request.symbol);
    const marketable = request.side === "BUY" ? request.price >= current : request.price <= current;
    if (!marketable) {
      const now = Date.now();
      const order: Order = {
        id: request.clientOrderId,
        clientOrderId: request.clientOrderId,
        symbol: normalizeSymbol(request.symbol),
        side: request.side,
        type: "LIMIT",
        status: "OPEN",
        requestedQuantity: request.quantity,
        executedQuantity: 0,
        requestedPrice: request.price,
        createdAt: now,
        updatedAt: now,
      };
      return { order, fills: [] };
    }
    return this.createMarketOrder(request);
  }

  async getOrder(_symbol: string, orderId: string): Promise<Order> {
    const order = this.engine.snapshot().orders.find((item) => item.id === orderId || item.clientOrderId === orderId);
    if (!order) throw new Error(`Simulated order ${orderId} not found`);
    return order;
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    return this.engine.snapshot().orders.filter((order) =>
      ["PENDING", "OPEN", "PARTIALLY_FILLED"].includes(order.status)
      && (!symbol || order.symbol === normalizeSymbol(symbol)),
    );
  }

  async cancelOrder(symbol: string, orderId: string): Promise<Order> {
    const order = await this.getOrder(symbol, orderId);
    if (order.status !== "OPEN" && order.status !== "PENDING") {
      throw new Error(`Order ${orderId} cannot be cancelled from ${order.status}`);
    }
    return { ...order, status: "CANCELLED", updatedAt: Date.now() };
  }

  async getRecentTrades(symbol: string, limit = 50): Promise<Trade[]> {
    return this.engine.snapshot().trades
      .filter((trade) => trade.symbol === normalizeSymbol(symbol))
      .slice(-limit);
  }

  async normalizeQuantity(_symbol: string, quantity: number): Promise<number> {
    return Math.floor(quantity / defaultFilter.stepSize) * defaultFilter.stepSize;
  }

  async normalizePrice(_symbol: string, price: number): Promise<number> {
    return Math.floor(price / defaultFilter.tickSize) * defaultFilter.tickSize;
  }
}
