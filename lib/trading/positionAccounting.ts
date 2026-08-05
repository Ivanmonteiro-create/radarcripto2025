import type { OrderSide } from "./domain";

export interface PositionAccountingState {
  quantity: number;
  averageEntryPrice: number;
  costBasisQuote: number;
  realizedPnl: number;
}

export interface ReconciledPosition {
  position: PositionAccountingState | null;
  realizedPnl: number;
}

export function reconcileSpotFill(
  previous: PositionAccountingState | null,
  fill: { side: OrderSide; quantity: number; price: number; feeQuote: number },
): ReconciledPosition {
  if (![fill.quantity, fill.price].every((value) => Number.isFinite(value) && value > 0) || !Number.isFinite(fill.feeQuote) || fill.feeQuote < 0) {
    throw new Error("Invalid fill accounting values");
  }
  if (fill.side === "BUY") {
    const previousQuantity = previous?.quantity ?? 0;
    const nextQuantity = previousQuantity + fill.quantity;
    const nextBasis = (previous?.costBasisQuote ?? 0) + fill.quantity * fill.price + fill.feeQuote;
    return {
      realizedPnl: 0,
      position: {
        quantity: nextQuantity,
        averageEntryPrice: ((previous?.averageEntryPrice ?? 0) * previousQuantity + fill.price * fill.quantity) / nextQuantity,
        costBasisQuote: nextBasis,
        realizedPnl: previous?.realizedPnl ?? 0,
      },
    };
  }
  if (!previous || fill.quantity > previous.quantity + 1e-10) throw new Error("Reconciliation refused Spot oversell");
  const ratio = fill.quantity / previous.quantity;
  const releasedBasis = previous.costBasisQuote * ratio;
  const realizedPnl = fill.quantity * fill.price - fill.feeQuote - releasedBasis;
  const remaining = previous.quantity - fill.quantity;
  if (remaining <= 1e-10) return { position: null, realizedPnl };
  return {
    realizedPnl,
    position: {
      quantity: remaining,
      averageEntryPrice: previous.averageEntryPrice,
      costBasisQuote: previous.costBasisQuote - releasedBasis,
      realizedPnl: previous.realizedPnl + realizedPnl,
    },
  };
}
