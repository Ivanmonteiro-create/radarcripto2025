import type { OrderSide } from "./domain";

export interface PositionAccountingState {
  quantity: number;
  averageEntryPrice: number;
  costBasisQuote: number;
  realizedPnl: number;
  decisionCostBasisQuote?: number;
  simulatedEntryFee?: number;
  simulatedEntrySlippage?: number;
  actualEntryFee?: number;
  actualEntrySlippage?: number;
  realisticEntryFee?: number;
  realisticEntrySlippage?: number;
}

export interface ReconciledPosition {
  position: PositionAccountingState | null;
  realizedPnl: number;
  grossPnl: number;
  actualNetPnl: number;
  simulatedNetPnl: number;
  realisticNetPnl: number;
  actualFeeCost: number;
  realisticFeeCost: number;
  simulatedFeeCost: number;
  observedSlippageCost: number;
  realisticSlippageCost: number;
  simulatedSlippageCost: number;
  totalRealisticCost: number;
  totalSimulatedCost: number;
}

export function reconcileSpotFill(
  previous: PositionAccountingState | null,
  fill: {
    side: OrderSide;
    quantity: number;
    price: number;
    feeQuote: number;
    decisionPrice?: number;
    simulatedFee?: number;
    simulatedSlippage?: number;
    realisticFee?: number;
    realisticSlippage?: number;
    actualSlippage?: number;
  },
): ReconciledPosition {
  if (![fill.quantity, fill.price].every((value) => Number.isFinite(value) && value > 0) || !Number.isFinite(fill.feeQuote) || fill.feeQuote < 0) {
    throw new Error("Invalid fill accounting values");
  }
  if (fill.side === "BUY") {
    const previousQuantity = previous?.quantity ?? 0;
    const nextQuantity = previousQuantity + fill.quantity;
    const nextBasis = (previous?.costBasisQuote ?? 0) + fill.quantity * fill.price + fill.feeQuote;
    const decisionPrice = fill.decisionPrice ?? fill.price;
    return {
      realizedPnl: 0,
      grossPnl: 0,
      actualNetPnl: 0,
      simulatedNetPnl: 0,
      realisticNetPnl: 0,
      actualFeeCost: 0,
      realisticFeeCost: 0,
      simulatedFeeCost: 0,
      observedSlippageCost: 0,
      realisticSlippageCost: 0,
      simulatedSlippageCost: 0,
      totalRealisticCost: 0,
      totalSimulatedCost: 0,
      position: {
        quantity: nextQuantity,
        averageEntryPrice: ((previous?.averageEntryPrice ?? 0) * previousQuantity + fill.price * fill.quantity) / nextQuantity,
        costBasisQuote: nextBasis,
        realizedPnl: previous?.realizedPnl ?? 0,
        decisionCostBasisQuote: (previous?.decisionCostBasisQuote ?? ((previous?.averageEntryPrice ?? 0) * previousQuantity)) + decisionPrice * fill.quantity,
        simulatedEntryFee: (previous?.simulatedEntryFee ?? 0) + (fill.simulatedFee ?? 0),
        simulatedEntrySlippage: (previous?.simulatedEntrySlippage ?? 0) + (fill.simulatedSlippage ?? 0),
        actualEntryFee: (previous?.actualEntryFee ?? 0) + fill.feeQuote,
        actualEntrySlippage: (previous?.actualEntrySlippage ?? 0) + (fill.actualSlippage ?? 0),
        realisticEntryFee: (previous?.realisticEntryFee ?? 0) + (fill.realisticFee ?? 0),
        realisticEntrySlippage: (previous?.realisticEntrySlippage ?? 0) + (fill.realisticSlippage ?? 0),
      },
    };
  }
  if (!previous || fill.quantity > previous.quantity + 1e-10) throw new Error("Reconciliation refused Spot oversell");
  const ratio = fill.quantity / previous.quantity;
  const releasedBasis = previous.costBasisQuote * ratio;
  const realizedPnl = fill.quantity * fill.price - fill.feeQuote - releasedBasis;
  const decisionBasis = previous.decisionCostBasisQuote ?? previous.averageEntryPrice * previous.quantity;
  const releasedDecisionBasis = decisionBasis * ratio;
  const releasedSimulatedFee = (previous.simulatedEntryFee ?? 0) * ratio;
  const releasedSimulatedSlippage = (previous.simulatedEntrySlippage ?? 0) * ratio;
  const releasedActualEntryFee = (previous.actualEntryFee ?? 0) * ratio;
  const releasedActualEntrySlippage = (previous.actualEntrySlippage ?? 0) * ratio;
  const releasedRealisticFee = (previous.realisticEntryFee ?? 0) * ratio;
  const releasedRealisticSlippage = (previous.realisticEntrySlippage ?? 0) * ratio;
  const grossPnl = fill.quantity * (fill.decisionPrice ?? fill.price) - releasedDecisionBasis;
  const simulatedNetPnl = grossPnl
    - releasedSimulatedFee
    - releasedSimulatedSlippage
    - (fill.simulatedFee ?? 0)
    - (fill.simulatedSlippage ?? 0);
  const realisticNetPnl = grossPnl
    - releasedRealisticFee
    - releasedRealisticSlippage
    - (fill.realisticFee ?? 0)
    - (fill.realisticSlippage ?? 0);
  const actualFeeCost = releasedActualEntryFee + fill.feeQuote;
  const simulatedFeeCost = releasedSimulatedFee + (fill.simulatedFee ?? 0);
  const realisticFeeCost = releasedRealisticFee + (fill.realisticFee ?? 0);
  const observedSlippageCost = releasedActualEntrySlippage + (fill.actualSlippage ?? 0);
  const simulatedSlippageCost = releasedSimulatedSlippage + (fill.simulatedSlippage ?? 0);
  const realisticSlippageCost = releasedRealisticSlippage + (fill.realisticSlippage ?? 0);
  const totalRealisticCost = realisticFeeCost + realisticSlippageCost;
  const totalSimulatedCost = simulatedFeeCost + simulatedSlippageCost;
  const remaining = previous.quantity - fill.quantity;
  if (remaining <= 1e-10) return {
    position: null, realizedPnl, grossPnl, actualNetPnl: realizedPnl, realisticNetPnl, simulatedNetPnl,
    actualFeeCost, realisticFeeCost, simulatedFeeCost, observedSlippageCost, realisticSlippageCost,
    simulatedSlippageCost, totalRealisticCost, totalSimulatedCost,
  };
  return {
    realizedPnl,
    grossPnl,
    actualNetPnl: realizedPnl,
    realisticNetPnl, simulatedNetPnl,
    actualFeeCost, realisticFeeCost,
    simulatedFeeCost,
    observedSlippageCost,
    realisticSlippageCost, simulatedSlippageCost,
    totalRealisticCost, totalSimulatedCost,
    position: {
      quantity: remaining,
      averageEntryPrice: previous.averageEntryPrice,
      costBasisQuote: previous.costBasisQuote - releasedBasis,
      realizedPnl: previous.realizedPnl + realizedPnl,
      decisionCostBasisQuote: decisionBasis - releasedDecisionBasis,
      simulatedEntryFee: (previous.simulatedEntryFee ?? 0) - releasedSimulatedFee,
      simulatedEntrySlippage: (previous.simulatedEntrySlippage ?? 0) - releasedSimulatedSlippage,
      actualEntryFee: (previous.actualEntryFee ?? 0) - releasedActualEntryFee,
      actualEntrySlippage: (previous.actualEntrySlippage ?? 0) - releasedActualEntrySlippage,
      realisticEntryFee: (previous.realisticEntryFee ?? 0) - releasedRealisticFee,
      realisticEntrySlippage: (previous.realisticEntrySlippage ?? 0) - releasedRealisticSlippage,
    },
  };
}
