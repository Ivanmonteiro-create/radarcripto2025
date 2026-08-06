"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Props = { pair: string; onPairChange?: (next: string) => void };
type Runtime = {
  status: string; lastPrice?: string; lastSignal?: string; lastSignalReason?: string;
  lastError?: string; workerHeartbeatAt?: string; dailyRealizedPnl?: string; updatedAt: string;
};
type Position = {
  symbol: string; quantity: string; averageEntryPrice: string; realizedPnl: string;
  unrealizedPnl: string; updatedAt: string;
};
type Order = { id: string; side: string; status: string; averageFillPrice?: string; createdAt: string };
type Log = { id: string; level: string; message: string; createdAt: string };
type ApiBot = {
  id: string; name: string; symbol: string; mode: "SIM" | "TESTNET"; status: string;
  capitalUSDT: string; strategyParams: Record<string, unknown>; runtime?: Runtime;
  positions: Position[]; orders: Order[]; logs: Log[];
};

const money = (value: string | number | undefined) => Number(value ?? 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 });

export default function BotRunnerClient({ pair, onPairChange }: Props) {
  const [bot, setBot] = useState<ApiBot | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const response = await fetch("/api/bots", { cache: "no-store" });
    if (response.status === 401) { setUnauthorized(true); return; }
    const payload = await response.json() as { ok: boolean; bots?: ApiBot[]; message?: string };
    if (!response.ok) { setMessage(payload.message ?? "Falha ao consultar o motor."); return; }
    setUnauthorized(false);
    setBot(payload.bots?.[0] ?? null);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => { setNow(Date.now()); void load(); }, 0);
    const timer = window.setInterval(() => { setNow(Date.now()); void load(); }, 3_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [load]);

  async function createBot() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/bots", {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" },
      body: JSON.stringify({
        name: "EMA Cross", symbol: pair, mode: "SIM", strategy: "EMA_CROSS",
        strategyParams: { shortPeriod: 9, longPeriod: 21 }, capitalUSDT: 1_000,
        maxCapitalUSDT: 1_000, maxOrderUSDT: 100, maxPositions: 1,
        maxDailyLossUSDT: 50, maxDrawdownPct: 10, minOrderIntervalMs: 60_000,
        takeProfitPct: 2, stopLossPct: 1,
      }),
    });
    setBusy(false);
    if (!response.ok) setMessage("Não foi possível criar o bot. Verifique banco e configuração.");
    await load();
  }

  async function action(type: "start" | "pause" | "stop") {
    if (!bot || !window.confirm(`Confirmar ação: ${type.toUpperCase()}?`)) return;
    setBusy(true);
    const response = await fetch(`/api/bots/${bot.id}/action?type=${type}`, {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ confirmation: true }),
    });
    setBusy(false);
    if (!response.ok) setMessage(`Ação ${type} recusada pelo servidor.`);
    await load();
  }

  async function closePosition() {
    if (!bot || !window.confirm("Fechar integralmente a posição Spot atual?")) return;
    setBusy(true);
    const response = await fetch(`/api/bots/${bot.id}/close-position`, {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ confirmation: true }),
    });
    setBusy(false);
    if (!response.ok) setMessage("Fechamento recusado. Consulte os logs.");
    await load();
  }

  async function killSwitch() {
    if (!window.confirm("ATIVAR KILL SWITCH GLOBAL e pausar todos os bots?")) return;
    setBusy(true);
    const response = await fetch("/api/kill-switch", {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" },
      body: JSON.stringify({ active: true, reason: "Activated from RadarCrypto dashboard" }),
    });
    setBusy(false);
    if (!response.ok) setMessage("Kill switch não foi aplicado.");
    await load();
  }

  async function applyPair() {
    if (!bot || bot.status === "RUNNING") return setMessage("Pause o bot antes de alterar o símbolo.");
    if (!window.confirm(`Alterar símbolo do bot para ${pair} e reiniciar indicadores?`)) return;
    const response = await fetch(`/api/bots/${bot.id}`, {
      method: "PATCH", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ symbol: pair }),
    });
    if (!response.ok) setMessage("Símbolo não alterado.");
    else onPairChange?.(pair);
    await load();
  }

  if (unauthorized) {
    return <div className="panel" style={{ padding: 18 }}><p>O painel do motor exige autenticação interna.</p><Link className="btn" href="/login">Entrar</Link></div>;
  }
  if (!bot) {
    return <div className="panel" style={{ padding: 18 }}><p>Nenhum bot persistido. O primeiro bot será criado em modo SIM.</p><button className="btn" disabled={busy} onClick={createBot}>Criar bot EMA Cross SIM</button>{message && <p className="pnlNeg">{message}</p>}</div>;
  }

  const position = bot.positions[0];
  const lastOrder = bot.orders[0];
  const heartbeat = bot.runtime?.workerHeartbeatAt ? new Date(bot.runtime.workerHeartbeatAt).getTime() : 0;
  const workerOnline = now > 0 && now - heartbeat < 15_000;
  const botExecutionStatus = bot.status === "RUNNING" ? (workerOnline ? "ATIVO" : "SEM HEARTBEAT") : bot.status;
  const equity = Number(bot.capitalUSDT) + Number(bot.runtime?.dailyRealizedPnl ?? 0) + Number(position?.unrealizedPnl ?? 0);

  return (
    <div className="panel" style={{ padding: 14, display: "grid", gap: 12 }}>
      <div className="compactHeader">
        <div><div className="compactTitle">{bot.name}</div><small className="muted">Dados do worker e PostgreSQL</small></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" disabled={busy || bot.status === "RUNNING"} onClick={() => action("start")}>Iniciar</button>
          <button className="btn" disabled={busy || bot.status !== "RUNNING"} onClick={() => action("pause")}>Pausar</button>
          <button className="btn" disabled={busy || bot.status === "STOPPED"} onClick={() => action("stop")}>Parar</button>
          <button className="btn" disabled={busy || !position} onClick={closePosition}>Fechar posição</button>
          <button className="btn btnSell" disabled={busy} onClick={killSwitch}>Kill Switch</button>
        </div>
      </div>

      <div className="highlight" style={{ padding: 10, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
        <Metric label="Modo" value={bot.mode} />
        <Metric label="Status" value={bot.status} />
        <Metric label="Execução do bot" value={botExecutionStatus} />
        <Metric label="Símbolo" value={bot.symbol} />
        <Metric label="Estratégia" value={String(bot.strategyParams.kind ?? "EMA_CROSS")} />
        <Metric label="Preço atual" value={money(bot.runtime?.lastPrice)} />
        <Metric label="Saldo/Capital" value={`${money(bot.capitalUSDT)} USDT`} />
        <Metric label="Equity" value={`${money(equity)} USDT`} />
        <Metric label="Quantidade" value={position ? Number(position.quantity).toFixed(8) : "—"} />
        <Metric label="Preço médio" value={position ? money(position.averageEntryPrice) : "—"} />
        <Metric label="PNL realizado" value={money(bot.runtime?.dailyRealizedPnl)} />
        <Metric label="PNL não realizado" value={money(position?.unrealizedPnl)} />
        <Metric label="Última ordem" value={lastOrder ? `${lastOrder.side} · ${lastOrder.status}` : "—"} />
        <Metric label="Próximo alvo" value="Definido pela estratégia/TP-SL" />
        <Metric label="Último sinal" value={`${bot.runtime?.lastSignal ?? "—"}: ${bot.runtime?.lastSignalReason ?? ""}`} />
        <Metric label="Atualização" value={bot.runtime?.updatedAt ? new Date(bot.runtime.updatedAt).toLocaleString() : "—"} />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>Par selecionado: {pair}</span><button className="btn" disabled={busy || pair === bot.symbol} onClick={applyPair}>Aplicar par ao bot</button>
      </div>
      {bot.runtime?.lastError && <p className="pnlNeg">Erro: {bot.runtime.lastError}</p>}
      {message && <p className="pnlNeg">{message}</p>}
      <div><strong>Logs recentes</strong>{bot.logs.length ? bot.logs.map((log) => <div key={log.id} className="muted">{new Date(log.createdAt).toLocaleString()} · {log.level} · {log.message}</div>) : <div className="muted">Sem logs.</div>}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><small className="muted">{label}</small><div className="bold" style={{ overflowWrap: "anywhere" }}>{value}</div></div>;
}
