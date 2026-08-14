export type LongExcursionState = {
  lowestPrice: number;
  highestPrice: number;
  maeQuote: number;
  maeBps: number;
  mfeQuote: number;
  mfeBps: number;
  maeAt: Date;
  mfeAt: Date;
};

export function updateLongExcursion(input: {
  entryPrice: number;
  quantity: number;
  currentPrice: number;
  now: Date;
  previous?: Partial<LongExcursionState> | null;
}): LongExcursionState {
  const { entryPrice, quantity, currentPrice, now } = input;
  if (![entryPrice, quantity, currentPrice].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("Invalid excursion values");
  }
  const previous = input.previous;
  const previousLow = previous?.lowestPrice ?? entryPrice;
  const previousHigh = previous?.highestPrice ?? entryPrice;
  const lowestPrice = Math.min(previousLow, currentPrice);
  const highestPrice = Math.max(previousHigh, currentPrice);
  const maeQuote = Math.max(0, (entryPrice - lowestPrice) * quantity);
  const mfeQuote = Math.max(0, (highestPrice - entryPrice) * quantity);
  return {
    lowestPrice, highestPrice, maeQuote, mfeQuote,
    maeBps: Math.max(0, (entryPrice - lowestPrice) / entryPrice * 10_000),
    mfeBps: Math.max(0, (highestPrice - entryPrice) / entryPrice * 10_000),
    maeAt: lowestPrice < previousLow ? now : previous?.maeAt ?? now,
    mfeAt: highestPrice > previousHigh ? now : previous?.mfeAt ?? now,
  };
}

export function calculateExitEfficiency(input: { entryPrice: number; exitPrice: number; mfeBps: number }) {
  const realizedMoveBps = (input.exitPrice - input.entryPrice) / input.entryPrice * 10_000;
  if (realizedMoveBps <= 0 || input.mfeBps <= 0) {
    return { realizedMoveBps, exitEfficiencyPct: null, profitGivebackBps: null };
  }
  return {
    realizedMoveBps,
    exitEfficiencyPct: realizedMoveBps / input.mfeBps * 100,
    profitGivebackBps: Math.max(0, input.mfeBps - realizedMoveBps),
  };
}
