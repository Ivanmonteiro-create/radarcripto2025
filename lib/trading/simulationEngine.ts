import type {
  Fill,
  Order,
  OrderSide,
  Position,
  SimulationSnapshot,
  Trade,
} from "./domain";
import { isSpotUsdtSymbol, normalizeSymbol } from "./domain";

export interface SimulationOptions {
  initialCashUSDT?: number;
  feeRate?: number;
  slippageBps?: number;
  now?: () => number;
  idFactory?: () => string;
}

export interface MarketOrderInput {
  symbol: string;
  side: OrderSide;
  marketPrice: number;
  quantity?: number;
  notionalUSDT?: number;
  clientOrderId?: string;
}

export interface ExitRule {
  takeProfitPrice?: number;
  stopLossPrice?: number;
}

const round = (value: number, decimals = 12) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export class SimulationEngine {
  private cash: number;
  private readonly initialCash: number;
  private readonly feeRate: number;
  private readonly slippageRate: number;
  private readonly now: () => number;
  private readonly idFactory: () => string;
  private readonly positions = new Map<string, Position>();
  private readonly prices = new Map<string, number>();
  private readonly orders: Order[] = [];
  private readonly fills: Fill[] = [];
  private readonly trades: Trade[] = [];
  private sequence = 0;

  constructor(options: SimulationOptions = {}) {
    this.initialCash = options.initialCashUSDT ?? 10_000;
    this.cash = this.initialCash;
    this.feeRate = options.feeRate ?? 0.001;
    this.slippageRate = (options.slippageBps ?? 0) / 10_000;
    this.now = options.now ?? Date.now;
    this.idFactory = options.idFactory ?? (() => `${this.now()}-${++this.sequence}`);
    if (this.initialCash < 0 || this.feeRate < 0 || this.slippageRate < 0) {
      throw new Error("Simulation options cannot be negative");
    }
  }

  setMarketPrice(symbolInput: string, price: number): void {
    const symbol = this.assertSymbol(symbolInput);
    this.assertPositive(price, "marketPrice");
    this.prices.set(symbol, price);
    const position = this.positions.get(symbol);
    if (position) {
      position.unrealizedPnl = round(position.quantity * price - position.costBasisQuote);
      position.updatedAt = this.now();
    }
  }

  createMarketOrder(input: MarketOrderInput): Order {
    const symbol = this.assertSymbol(input.symbol);
    this.assertPositive(input.marketPrice, "marketPrice");
    this.setMarketPrice(symbol, input.marketPrice);

    const executionPrice = round(
      input.marketPrice * (input.side === "BUY" ? 1 + this.slippageRate : 1 - this.slippageRate),
    );
    const quantity = this.resolveQuantity(input, executionPrice);
    const timestamp = this.now();
    const orderId = this.idFactory();
    const order: Order = {
      id: orderId,
      clientOrderId: input.clientOrderId ?? `sim-${orderId}`,
      symbol,
      side: input.side,
      type: "MARKET",
      status: "PENDING",
      requestedQuantity: quantity,
      executedQuantity: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.orders.push(order);

    try {
      const notional = round(quantity * executionPrice);
      const fee = round(notional * this.feeRate);
      const realizedPnl = input.side === "BUY"
        ? this.applyBuy(symbol, quantity, executionPrice, fee, timestamp)
        : this.applySell(symbol, quantity, executionPrice, fee, timestamp);

      order.status = "FILLED";
      order.executedQuantity = quantity;
      order.averageFillPrice = executionPrice;
      order.updatedAt = this.now();
      const fillId = this.idFactory();
      this.fills.push({
        id: fillId,
        orderId,
        symbol,
        side: input.side,
        price: executionPrice,
        quantity,
        feeQuote: fee,
        timestamp,
      });
      this.trades.push({
        id: this.idFactory(),
        orderId,
        symbol,
        side: input.side,
        price: executionPrice,
        quantity,
        notionalQuote: notional,
        feeQuote: fee,
        realizedPnl,
        timestamp,
      });
      this.markAllPositions();
    } catch (error) {
      order.status = "REJECTED";
      order.rejectReason = error instanceof Error ? error.message : "Unknown simulation error";
      order.updatedAt = this.now();
      throw error;
    }
    return { ...order };
  }

  evaluateExit(symbolInput: string, marketPrice: number, rule: ExitRule): Order | null {
    const symbol = this.assertSymbol(symbolInput);
    this.setMarketPrice(symbol, marketPrice);
    const position = this.positions.get(symbol);
    if (!position) return null;
    const hitTakeProfit = rule.takeProfitPrice !== undefined && marketPrice >= rule.takeProfitPrice;
    const hitStopLoss = rule.stopLossPrice !== undefined && marketPrice <= rule.stopLossPrice;
    if (!hitTakeProfit && !hitStopLoss) return null;
    return this.createMarketOrder({
      symbol,
      side: "SELL",
      quantity: position.quantity,
      marketPrice,
      clientOrderId: `sim-exit-${this.idFactory()}`,
    });
  }

  getPosition(symbol: string): Position | undefined {
    const position = this.positions.get(normalizeSymbol(symbol));
    return position ? { ...position } : undefined;
  }

  snapshot(): SimulationSnapshot {
    this.markAllPositions();
    const positions = [...this.positions.values()].map((position) => ({ ...position }));
    const unrealizedPnl = round(positions.reduce((sum, position) => sum + position.unrealizedPnl, 0));
    const marketValue = round(positions.reduce((sum, position) => {
      const mark = this.prices.get(position.symbol) ?? position.averageEntryPrice;
      return sum + position.quantity * mark;
    }, 0));
    return {
      cash: round(this.cash),
      equity: round(this.cash + marketValue),
      realizedPnl: round(this.trades.reduce((sum, trade) => sum + trade.realizedPnl, 0)),
      unrealizedPnl,
      positions,
      orders: this.orders.map((order) => ({ ...order })),
      fills: this.fills.map((fill) => ({ ...fill })),
      trades: this.trades.map((trade) => ({ ...trade })),
    };
  }

  reset(): void {
    this.cash = this.initialCash;
    this.positions.clear();
    this.prices.clear();
    this.orders.length = 0;
    this.fills.length = 0;
    this.trades.length = 0;
  }

  restore(state: Pick<SimulationSnapshot, "cash" | "positions" | "orders" | "fills" | "trades">): void {
    if (!Number.isFinite(state.cash) || state.cash < 0) throw new Error("Invalid restored simulated cash");
    this.cash = state.cash;
    this.positions.clear();
    for (const position of state.positions) {
      const symbol = this.assertSymbol(position.symbol);
      if (position.quantity <= 0) throw new Error("Restored positions require positive quantity");
      this.positions.set(symbol, { ...position, symbol });
    }
    this.orders.splice(0, this.orders.length, ...state.orders.map((order) => ({ ...order })));
    this.fills.splice(0, this.fills.length, ...state.fills.map((fill) => ({ ...fill })));
    this.trades.splice(0, this.trades.length, ...state.trades.map((trade) => ({ ...trade })));
    this.markAllPositions();
  }

  private applyBuy(symbol: string, quantity: number, price: number, fee: number, timestamp: number): number {
    const notional = round(quantity * price);
    const totalCost = round(notional + fee);
    if (totalCost > this.cash + 1e-9) throw new Error("Insufficient simulated USDT balance");
    const previous = this.positions.get(symbol);
    const previousQuantity = previous?.quantity ?? 0;
    const previousBasis = previous?.costBasisQuote ?? 0;
    const newQuantity = round(previousQuantity + quantity);
    const newBasis = round(previousBasis + totalCost);
    this.cash = round(this.cash - totalCost);
    this.positions.set(symbol, {
      id: previous?.id ?? this.idFactory(),
      symbol,
      quantity: newQuantity,
      averageEntryPrice: round(
        ((previous?.averageEntryPrice ?? 0) * previousQuantity + price * quantity) / newQuantity,
      ),
      side: "LONG",
      openedAt: previous?.openedAt ?? timestamp,
      updatedAt: timestamp,
      realizedPnl: previous?.realizedPnl ?? 0,
      unrealizedPnl: round(newQuantity * (this.prices.get(symbol) ?? price) - newBasis),
      costBasisQuote: newBasis,
    });
    return 0;
  }

  private applySell(symbol: string, quantity: number, price: number, fee: number, timestamp: number): number {
    const previous = this.positions.get(symbol);
    if (!previous || quantity > previous.quantity + 1e-10) {
      throw new Error("Spot simulation cannot sell more than the existing position");
    }
    const ratio = quantity / previous.quantity;
    const releasedBasis = round(previous.costBasisQuote * ratio);
    const proceeds = round(quantity * price - fee);
    const realized = round(proceeds - releasedBasis);
    const remaining = round(previous.quantity - quantity);
    this.cash = round(this.cash + proceeds);
    if (remaining <= 1e-10) {
      this.positions.delete(symbol);
    } else {
      previous.quantity = remaining;
      previous.costBasisQuote = round(previous.costBasisQuote - releasedBasis);
      previous.realizedPnl = round(previous.realizedPnl + realized);
      previous.unrealizedPnl = round(remaining * (this.prices.get(symbol) ?? price) - previous.costBasisQuote);
      previous.updatedAt = timestamp;
    }
    return realized;
  }

  private resolveQuantity(input: MarketOrderInput, executionPrice: number): number {
    if (input.quantity !== undefined) {
      this.assertPositive(input.quantity, "quantity");
      return round(input.quantity);
    }
    if (input.notionalUSDT !== undefined) {
      this.assertPositive(input.notionalUSDT, "notionalUSDT");
      return round(input.notionalUSDT / executionPrice);
    }
    throw new Error("Market order requires quantity or notionalUSDT");
  }

  private markAllPositions(): void {
    for (const position of this.positions.values()) {
      const mark = this.prices.get(position.symbol) ?? position.averageEntryPrice;
      position.unrealizedPnl = round(position.quantity * mark - position.costBasisQuote);
    }
  }

  private assertSymbol(symbolInput: string): string {
    const symbol = normalizeSymbol(symbolInput);
    if (!isSpotUsdtSymbol(symbol)) throw new Error(`Invalid Spot USDT symbol: ${symbolInput}`);
    return symbol;
  }

  private assertPositive(value: number, field: string): void {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be a positive finite number`);
  }
}
