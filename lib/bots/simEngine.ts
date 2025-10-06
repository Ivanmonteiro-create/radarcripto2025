// lib/bots/simEngine.ts
"use client";

import { BotConfig, BotRuntime, OrderFill, Signal, Side } from "./types";
import { loadRuntime, saveRuntime } from "./store";
import { createEmaCross } from "./strategies/emaCross";

type OnUpdate = (rt: BotRuntime) => void;

export class SimEngine {
  private runtime: Record<string, BotRuntime>;
  private onUpdate?: OnUpdate;

  constructor(onUpdate?: OnUpdate) {
    this.runtime = loadRuntime();
    this.onUpdate = onUpdate;
  }

  public get(botId: string) {
    return this.runtime[botId];
  }

  public ensure(bot: BotConfig) {
    if (!this.runtime[bot.id]) {
      this.runtime[bot.id] = {
        id: bot.id,
        equityUSDT: bot.risk.capitalUSDT,
        openPos: null,
        fills: [],
        pnlUSDT: 0,
        bars: 0,
      };
      saveRuntime(this.runtime);
    }
  }

  /** 1 passo de simulação com um preço (tick) */
  public step(bot: BotConfig, price: number, ts = Date.now()) {
    this.ensure(bot);
    const rt = this.runtime[bot.id];

    // --- estratégia
    let signal: Signal = "HOLD";
    if (bot.strategy.kind === "ema-cross") {
      const short = bot.strategy.params.short ?? 9;
      const long  = bot.strategy.params.long ?? 21;
      // guardamos uma factory por bot em memória global do window
      const key = `__rc_ema_${bot.id}`;
      const g = (globalThis as any);
      if (!g[key]) g[key] = createEmaCross(short, long);
      signal = g[key](price);
    }

    // --- gerenciamento de posição
    const tpPct = bot.risk.takeProfitPct ?? 0;
    const slPct = bot.risk.stopLossPct ?? 0;

    // 1) checks TP/SL se houver posição
    if (rt.openPos) {
      const p = rt.openPos;
      const upPct = ((price - p.entryPrice) / p.entryPrice) * 100 * (p.side === "BUY" ? 1 : -1);
      if (tpPct > 0 && upPct >= tpPct) this.close(bot, price, ts, "tp");
      else if (slPct > 0 && upPct <= -slPct) this.close(bot, price, ts, "sl");
    }

    // 2) sinais
    if (signal !== "HOLD") {
      if (!rt.openPos) {
        // abre posição
        const qtyUSDT = (rt.equityUSDT * (bot.risk.orderSizePct / 100));
        if (qtyUSDT > 1) this.open(bot, signal === "BUY" ? "BUY" : "SELL", price, qtyUSDT, ts);
      } else {
        // se sinal contrário, inverte
        const wantSide: Side = signal === "BUY" ? "BUY" : "SELL";
        if (rt.openPos.side !== wantSide) {
          this.close(bot, price, ts, "signal");
          const qtyUSDT = (rt.equityUSDT * (bot.risk.orderSizePct / 100));
          if (qtyUSDT > 1) this.open(bot, wantSide, price, qtyUSDT, ts);
        }
      }
    }

    rt.lastSignal = signal;
    rt.bars += 1;
    rt.peakEquity = Math.max(rt.peakEquity ?? rt.equityUSDT, rt.equityUSDT);
    rt.minEquity  = Math.min(rt.minEquity  ?? rt.equityUSDT, rt.equityUSDT);

    saveRuntime(this.runtime);
    this.onUpdate?.(rt);
    return rt;
  }

  private open(bot: BotConfig, side: Side, price: number, qtyUSDT: number, ts: number) {
    const rt = this.runtime[bot.id];
    const size = qtyUSDT / Math.max(price, 1e-8);
    rt.openPos = { side, entryPrice: price, qtyUSDT, size, openedAt: ts };
    const fill: OrderFill = { side, price, qtyUSDT, size, ts, reason: "signal" };
    rt.fills.push(fill);
  }

  private close(bot: BotConfig, price: number, ts: number, reason: OrderFill["reason"]) {
    const rt = this.runtime[bot.id];
    const p = rt.openPos!;
    const mult = p.side === "BUY" ? 1 : -1;
    const pnl = (price - p.entryPrice) * p.size * mult;
    rt.pnlUSDT += pnl;
    rt.equityUSDT += pnl;
    rt.openPos = null;
    const fill: OrderFill = { side: p.side, price, qtyUSDT: p.qtyUSDT, size: p.size, ts, reason };
    rt.fills.push(fill);
  }
}
