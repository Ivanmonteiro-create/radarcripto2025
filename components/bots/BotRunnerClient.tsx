"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = { pair: string; onPairChange?: (next: string) => void };
type Runtime = {
  status: string; lastPrice?: string; lastSignal?: string; lastSignalReason?: string;
  lastError?: string; workerHeartbeatAt?: string; dailyRealizedPnl?: string; updatedAt: string;
};
type Position = { symbol: string; quantity: string; averageEntryPrice: string; realizedPnl: string; unrealizedPnl: string; updatedAt: string };
type Order = { id: string; side: string; status: string; averageFillPrice?: string; createdAt: string };
type Log = { id: string; level: string; message: string; createdAt: string };
type ApiBot = {
  id: string; name: string; symbol: string; mode: "SIM" | "TESTNET"; status: string;
  capitalUSDT: string; strategyParams: Record<string, unknown>; runtime?: Runtime;
  positions: Position[]; orders: Order[]; logs: Log[];
};
type TestStatus = "IN_PROGRESS" | "COMPLETED" | "INTERRUPTED" | "ERROR";
type TestRun = {
  id: string; status: TestStatus; testStartedAt: string; testEndsAt: string; completedAt?: string;
  durationMinutes: number; actualDurationMs?: number; configuration: Record<string, unknown>;
  mode: string; symbol: string; strategy: string; stopReason?: string; endedWithOpenPosition: boolean;
  observations: number; crossoverCount: number; buySignals: number; sellSignals: number; holdSignals: number;
  buyBlocked: number; sellIgnored: number; cooldownBlocks: number; errorCount: number;
  initialEquity: string; peakEquity: string; finalEquity?: string; realizedPnl: string; unrealizedPnl: string;
  finalPnl?: string; currentDrawdownPct: string; maxDrawdownPct: string; lastSignal?: string;
  lastError?: string; lastHeartbeatAt?: string; finalPosition?: unknown; summary?: Record<string, unknown>;
  buyExecuted: number; sellExecuted: number; orderCount: number; fillCount: number; riskEventCount: number;
};

const AUTHORIZATION = "I_AUTHORIZE_BINANCE_SPOT_TESTNET_AUTONOMOUS_TEST";
const money = (value: string | number | undefined) => Number(value ?? 0).toLocaleString("pt-PT", { maximumFractionDigits: 6 });
const dateTime = (value?: string) => value ? new Date(value).toLocaleString("pt-PT") : "—";
const duration = (milliseconds: number) => {
  const total = Math.max(0, Math.floor(milliseconds / 1_000));
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
};
const statusLabel: Record<TestStatus, string> = {
  IN_PROGRESS: "EM ANDAMENTO", COMPLETED: "CONCLUÍDO", INTERRUPTED: "INTERROMPIDO", ERROR: "ERRO",
};

export default function BotRunnerClient({ pair, onPairChange }: Props) {
  const [bot, setBot] = useState<ApiBot | null>(null);
  const [tests, setTests] = useState<TestRun[]>([]);
  const [unauthorized, setUnauthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(0);
  const [durationChoice, setDurationChoice] = useState("24");
  const [customMinutes, setCustomMinutes] = useState("60");
  const [authorization, setAuthorization] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/bots", { cache: "no-store" });
    if (response.status === 401) { setUnauthorized(true); return; }
    const payload = await response.json() as { ok: boolean; bots?: ApiBot[]; message?: string };
    if (!response.ok) { setMessage(payload.message ?? "Falha ao consultar o motor."); return; }
    setUnauthorized(false);
    const selected = payload.bots?.[0] ?? null;
    setBot(selected);
    if (selected) {
      const testsResponse = await fetch(`/api/bots/${selected.id}/tests`, { cache: "no-store" });
      const testsPayload = await testsResponse.json() as { ok: boolean; tests?: TestRun[] };
      if (testsResponse.ok) setTests(testsPayload.tests ?? []);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => { setNow(Date.now()); void load(); }, 0);
    const timer = window.setInterval(() => { setNow(Date.now()); void load(); }, 3_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [load]);

  const activeTest = tests.find((test) => test.status === "IN_PROGRESS");
  const latestTest = activeTest ?? tests[0];
  const durationMinutes = durationChoice === "custom" ? Number(customMinutes) : Number(durationChoice) * 60;
  const projectedEnd = useMemo(() => now && Number.isFinite(durationMinutes)
    ? new Date(now + durationMinutes * 60_000).toLocaleString("pt-PT") : "—", [durationMinutes, now]);

  async function createBot() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/bots", {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" },
      body: JSON.stringify({
        name: "EMA Cross", symbol: pair, mode: "SIM", strategy: "EMA_CROSS", strategyParams: { shortPeriod: 9, longPeriod: 21 },
        capitalUSDT: 1_000, maxCapitalUSDT: 1_000, maxOrderUSDT: 100, maxPositions: 1,
        maxDailyLossUSDT: 50, maxDrawdownPct: 10, minOrderIntervalMs: 60_000, takeProfitPct: 2, stopLossPct: 1,
      }),
    });
    setBusy(false);
    if (!response.ok) setMessage("Não foi possível criar o bot. Verifique banco e configuração.");
    await load();
  }

  async function startTest() {
    if (!bot || authorization !== AUTHORIZATION) return setMessage("Digite a frase exata de autorização antes de iniciar.");
    if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 10_080) return setMessage("A duração deve ficar entre 5 minutos e 7 dias.");
    if (!window.confirm(`Iniciar teste autônomo de ${durationMinutes} minutos no ${bot.mode}?`)) return;
    setBusy(true); setMessage("");
    const response = await fetch(`/api/bots/${bot.id}/tests`, {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" },
      body: JSON.stringify({ durationMinutes, authorization }),
    });
    const payload = await response.json() as { message?: string };
    setBusy(false);
    setMessage(response.ok ? "Teste iniciado e persistido no worker." : `Teste recusado: ${payload.message ?? "erro desconhecido"}`);
    if (response.ok) setAuthorization("");
    await load();
  }

  async function stopTest() {
    if (!bot || !activeTest || !window.confirm("Interromper o teste? Posições abertas não serão vendidas automaticamente.")) return;
    setBusy(true);
    const response = await fetch(`/api/bots/${bot.id}/tests/${activeTest.id}/stop`, {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ confirmation: true }),
    });
    setBusy(false);
    setMessage(response.ok ? "Encerramento solicitado e reconciliado." : "O encerramento foi recusado.");
    await load();
  }

  async function closePosition() {
    if (!bot || !window.confirm("Fechar integralmente a posição Spot atual?")) return;
    setBusy(true);
    const response = await fetch(`/api/bots/${bot.id}/close-position`, {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ confirmation: true }),
    });
    setBusy(false); if (!response.ok) setMessage("Fechamento recusado. Consulte os logs."); await load();
  }

  async function killSwitch() {
    if (!window.confirm("ATIVAR KILL SWITCH GLOBAL e pausar todos os bots?")) return;
    setBusy(true);
    const response = await fetch("/api/kill-switch", {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" },
      body: JSON.stringify({ active: true, reason: "Activated from RadarCrypto dashboard" }),
    });
    setBusy(false); if (!response.ok) setMessage("Kill switch não foi aplicado."); await load();
  }

  async function applyPair() {
    if (!bot || bot.status === "RUNNING") return setMessage("Pare o bot antes de alterar o símbolo.");
    if (!window.confirm(`Alterar símbolo do bot para ${pair} e reiniciar indicadores?`)) return;
    const response = await fetch(`/api/bots/${bot.id}`, {
      method: "PATCH", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ symbol: pair }),
    });
    if (!response.ok) setMessage("Símbolo não alterado."); else onPairChange?.(pair); await load();
  }

  if (unauthorized) return <div className="panel" style={{ padding: 18 }}><p>O painel do motor exige autenticação interna.</p><Link className="btn" href="/login">Entrar</Link></div>;
  if (!bot) return <div className="panel" style={{ padding: 18 }}><p>Nenhum bot persistido. O primeiro bot será criado em modo SIM.</p><button className="btn" disabled={busy} onClick={createBot}>Criar bot EMA Cross SIM</button>{message && <p className="pnlNeg">{message}</p>}</div>;

  const position = bot.positions[0];
  const lastOrder = bot.orders[0];
  const heartbeat = bot.runtime?.workerHeartbeatAt ? new Date(bot.runtime.workerHeartbeatAt).getTime() : 0;
  const workerOnline = now > 0 && now - heartbeat < 15_000;
  const samplingIntervalMs = Number(bot.strategyParams.samplingIntervalMs ?? 5_000);
  const samplingDescription = `Ticker · ${money(samplingIntervalMs / 1_000)} s (não candles)`;
  const elapsed = latestTest ? Math.max(0, (latestTest.completedAt ? new Date(latestTest.completedAt).getTime() : now) - new Date(latestTest.testStartedAt).getTime()) : 0;
  const remaining = activeTest ? Math.max(0, new Date(activeTest.testEndsAt).getTime() - now) : 0;
  const warmupTarget = Number(latestTest?.configuration?.strategyParams && (latestTest.configuration.strategyParams as Record<string, unknown>).longPeriod || 21);

  return <div className="panel" style={{ padding: 14, display: "grid", gap: 16 }}>
    <div className="compactHeader">
      <div><div className="compactTitle">{bot.name}</div><small className="muted">Teste persistente controlado pelo worker Railway</small></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" disabled={busy || !activeTest} onClick={stopTest}>Encerrar teste</button>
        <button className="btn" disabled={busy || !position} onClick={closePosition}>Fechar posição</button>
        <button className="btn btnSell" disabled={busy} onClick={killSwitch}>Kill Switch</button>
      </div>
    </div>

    <section className="highlight" style={{ padding: 12 }}>
      <strong>CONTROLE DO TESTE</strong>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
        <label>Duração<br/><select value={durationChoice} disabled={Boolean(activeTest)} onChange={(event) => setDurationChoice(event.target.value)}>
          <option value="1">1 hora</option><option value="6">6 horas</option><option value="12">12 horas</option><option value="24">24 horas</option><option value="custom">Personalizada</option>
        </select></label>
        {durationChoice === "custom" && <label>Minutos (5–10080)<br/><input type="number" min={5} max={10080} value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value)}/></label>}
        <label style={{ flex: "1 1 360px" }}>Frase de autorização<br/><input style={{ width: "100%" }} autoComplete="off" value={authorization} disabled={Boolean(activeTest)} onChange={(event) => setAuthorization(event.target.value)} placeholder={AUTHORIZATION}/></label>
        <button className="btn" disabled={busy || Boolean(activeTest) || bot.status !== "STOPPED"} onClick={startTest}>INICIAR TESTE</button>
      </div>
      {!activeTest && <small className="muted">Término previsto se iniciado agora: {projectedEnd}. O navegador pode ser fechado após a confirmação.</small>}
    </section>

    <section>
      <strong>STATUS DO TESTE — {latestTest ? statusLabel[latestTest.status] : "NÃO INICIADO"}</strong>
      {latestTest?.endedWithOpenPosition && <p className="pnlNeg">TESTE ENCERRADO — POSIÇÃO AINDA ABERTA</p>}
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <Metric label="Início" value={dateTime(latestTest?.testStartedAt)} /><Metric label="Término previsto" value={dateTime(latestTest?.testEndsAt)} />
        <Metric label="Tempo decorrido" value={latestTest ? duration(elapsed) : "—"} /><Metric label="Tempo restante" value={activeTest ? duration(remaining) : "—"} />
        <Metric label="Modo" value={latestTest?.mode ?? bot.mode} /><Metric label="Estratégia" value={latestTest?.strategy ?? String(bot.strategyParams.kind ?? "EMA_CROSS")} />
        <Metric label="Símbolo" value={latestTest?.symbol ?? bot.symbol} /><Metric label="Fonte de preço" value={samplingDescription} />
        <Metric label="Observações" value={String(latestTest?.observations ?? 0)} /><Metric label="Warm-up" value={`${Math.min(latestTest?.observations ?? 0, warmupTarget)}/${warmupTarget}`} />
        <Metric label="BUY / SELL / HOLD" value={`${latestTest?.buySignals ?? 0} / ${latestTest?.sellSignals ?? 0} / ${latestTest?.holdSignals ?? 0}`} />
        <Metric label="Ordens / Fills" value={`${latestTest?.orderCount ?? 0} / ${latestTest?.fillCount ?? 0}`} />
        <Metric label="Posições abertas" value={position ? "1" : "0"} /><Metric label="PNL realizado" value={`${money(latestTest?.realizedPnl)} USDT`} />
        <Metric label="PNL não realizado" value={`${money(latestTest?.unrealizedPnl)} USDT`} /><Metric label="Equity" value={`${money(latestTest?.finalEquity ?? latestTest?.peakEquity ?? bot.capitalUSDT)} USDT`} />
        <Metric label="Drawdown atual / máximo" value={`${money(latestTest?.currentDrawdownPct)}% / ${money(latestTest?.maxDrawdownPct)}%`} />
        <Metric label="Cooldown bloqueados" value={String(latestTest?.cooldownBlocks ?? 0)} /><Metric label="Eventos de risco" value={String(latestTest?.riskEventCount ?? 0)} />
        <Metric label="Último sinal" value={latestTest?.lastSignal ?? bot.runtime?.lastSignal ?? "—"} /><Metric label="Última ordem" value={lastOrder ? `${lastOrder.side} · ${lastOrder.status}` : "—"} />
        <Metric label="Último erro" value={latestTest?.lastError ?? bot.runtime?.lastError ?? "—"} /><Metric label="Heartbeat" value={`${workerOnline ? "RECENTE" : "SEM HEARTBEAT"} · ${dateTime(latestTest?.lastHeartbeatAt ?? bot.runtime?.workerHeartbeatAt)}`} />
      </div>
    </section>

    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><span>Par selecionado: {pair}</span><button className="btn" disabled={busy || pair === bot.symbol || Boolean(activeTest)} onClick={applyPair}>Aplicar par ao bot</button></div>
    {message && <p className={message.includes("iniciado") ? "pnlPos" : "pnlNeg"}>{message}</p>}

    <section><strong>HISTÓRICO DE TESTES</strong>{tests.length ? tests.map((test) => <details key={test.id} style={{ marginTop: 8 }}>
      <summary>{dateTime(test.testStartedAt)} · {test.durationMinutes} min · {test.strategy} · {test.symbol} · {statusLabel[test.status]} · PNL {money(test.finalPnl ?? test.realizedPnl)} USDT · DD {money(test.maxDrawdownPct)}% · {test.buyExecuted + test.sellExecuted} trades</summary>
      <div className="highlight" style={{ marginTop: 6, padding: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
        <Metric label="Duração real" value={duration(test.actualDurationMs ?? 0)} /><Metric label="Motivo" value={test.stopReason ?? "—"} />
        <Metric label="Cruzamentos" value={String(test.crossoverCount)} /><Metric label="BUY executados / bloqueados" value={`${test.buyExecuted} / ${test.buyBlocked}`} />
        <Metric label="SELL executados / ignorados" value={`${test.sellExecuted} / ${test.sellIgnored}`} /><Metric label="Equity inicial / final" value={`${money(test.initialEquity)} / ${money(test.finalEquity)} USDT`} />
        <Metric label="Erros" value={String(test.errorCount)} /><Metric label="Posição final" value={test.endedWithOpenPosition ? "ABERTA" : "ZERADA"} />
      </div>
    </details>) : <div className="muted">Nenhum teste registrado.</div>}</section>

    <section><strong>Logs recentes</strong>{bot.logs.length ? bot.logs.map((log) => <div key={log.id} className="muted">{dateTime(log.createdAt)} · {log.level} · {log.message}</div>) : <div className="muted">Sem logs.</div>}</section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><small className="muted">{label}</small><div className="bold" style={{ overflowWrap: "anywhere" }}>{value}</div></div>;
}
