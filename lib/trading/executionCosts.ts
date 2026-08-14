import type { OrderSide, OrderType } from "./domain";

export type CostModelConfig = {
  enabled: boolean;
  realisticTakerFeeBps: number;
  realisticSlippageBps: number;
  simulatedMakerFeeBps: number;
  simulatedTakerFeeBps: number;
  simulatedSlippageBps: number;
};

export function calculateExecutionCosts(input: {
  side: OrderSide;
  type: OrderType;
  decisionPrice: number;
  averageFillPrice: number;
  quantity: number;
  exchangeFeeActual: number;
  costModel: CostModelConfig;
}) {
  const { decisionPrice, averageFillPrice, quantity } = input;
  if (![decisionPrice, averageFillPrice, quantity].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("Invalid execution telemetry values");
  }
  const direction = input.side === "BUY" ? 1 : -1;
  const slippageQuote = (averageFillPrice - decisionPrice) * quantity * direction;
  const slippageBps = ((averageFillPrice - decisionPrice) / decisionPrice) * 10_000 * direction;
  const feeBps = input.type === "MARKET"
    ? input.costModel.simulatedTakerFeeBps
    : input.costModel.simulatedMakerFeeBps;
  const decisionNotional = decisionPrice * quantity;
  return {
    slippageQuote,
    slippageBps,
    exchangeFeeActual: input.exchangeFeeActual,
    realisticFee: input.costModel.enabled ? decisionNotional * input.costModel.realisticTakerFeeBps / 10_000 : 0,
    realisticSlippage: input.costModel.enabled ? decisionNotional * input.costModel.realisticSlippageBps / 10_000 : 0,
    simulatedFee: input.costModel.enabled ? decisionNotional * feeBps / 10_000 : 0,
    simulatedSlippage: input.costModel.enabled ? decisionNotional * input.costModel.simulatedSlippageBps / 10_000 : 0,
  };
}
