import type { AccountBalance, Fill, Order, OrderSide, SymbolInfo, Trade } from "@/lib/trading/domain";

export interface MarketOrderRequest {
  symbol: string;
  side: OrderSide;
  quantity?: number;
  quoteOrderQty?: number;
  clientOrderId: string;
}

export interface LimitOrderRequest {
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  clientOrderId: string;
}

export interface ExchangeOrderResult {
  order: Order;
  fills: Fill[];
}

export interface IExchange {
  readonly mode: "SIM" | "TESTNET";
  getAccountBalances(): Promise<AccountBalance[]>;
  getSymbolInfo(symbol: string): Promise<SymbolInfo>;
  getTickerPrice(symbol: string): Promise<number>;
  createMarketOrder(request: MarketOrderRequest): Promise<ExchangeOrderResult>;
  createLimitOrder(request: LimitOrderRequest): Promise<ExchangeOrderResult>;
  getOrder(symbol: string, orderId: string): Promise<Order>;
  getOpenOrders(symbol?: string): Promise<Order[]>;
  cancelOrder(symbol: string, orderId: string): Promise<Order>;
  getRecentTrades(symbol: string, limit?: number): Promise<Trade[]>;
  normalizeQuantity(symbol: string, quantity: number): Promise<number>;
  normalizePrice(symbol: string, price: number): Promise<number>;
}
