// lib/bots/strategies/emaCross.ts
import type { Signal } from "../types";

export function makeEma(period: number) {
  const k = 2 / (period + 1);
  let ema: number | undefined;
  return (price: number) => {
    ema = ema === undefined ? price : price * k + ema * (1 - k);
    return ema;
  };
}

export function createEmaCross(shortLen = 9, longLen = 21) {
  const s = makeEma(shortLen);
  const l = makeEma(longLen);
  let lastDiff = 0;
  return (price: number): Signal => {
    const se = s(price)!;
    const le = l(price)!;
    const diff = se - le;
    let sig: Signal = "HOLD";
    if (lastDiff <= 0 && diff > 0) sig = "BUY";
    if (lastDiff >= 0 && diff < 0) sig = "SELL";
    lastDiff = diff;
    return sig;
  };
}
