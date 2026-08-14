"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { currentEquityValue } from "@/lib/trading/timedTest";
import HybridStrategyConfigurator from "@/components/bots/HybridStrategyConfigurator";
import { useI18n } from "@/components/i18n/LocaleProvider";

type Props = { pair: string; onPairChange?: (next: string) => void };
type Runtime = {
  status: string; lastPrice?: string; lastSignal?: string; lastSignalReason?: string;
  lastError?: string; workerHeartbeatAt?: string; dailyRealizedPnl?: string; updatedAt: string;
  strategyState?: Record<string, unknown>;
};
type Position = {
  symbol: string; quantity: string; averageEntryPrice: string; realizedPnl: string; unrealizedPnl: string; updatedAt: string;
  maeQuote?: string; maeBps?: string; mfeQuote?: string; mfeBps?: string;
};
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
  initialEquity: string; peakEquity: string; currentEquity?: string; finalEquity?: string; realizedPnl: string; unrealizedPnl: string;
  grossPnl?: string; actualNetPnl?: string; simulatedNetPnl?: string; exchangeFeeActual?: string;
  realisticNetPnl?: string; realisticFee?: string; realisticSlippage?: string;
  simulatedFee?: string; actualSlippage?: string; simulatedSlippage?: string;
  insufficientEdgeBlocks?: number; insufficientRangeBlocks?: number; microCrossoversFiltered?: number;
  insufficientRealisticEdgeBlocks?: number; insufficient5mRangeBlocks?: number; insufficient15mRangeBlocks?: number;
  lastExpectedMoveBps?: string; lastRollingRangeBps?: string; lastEmaSeparationBps?: string;
  lastRange2mBps?: string; lastRange5mBps?: string; lastRange15mBps?: string;
  lastMomentum2mBps?: string; lastMomentum5mBps?: string; lastMomentum15mBps?: string;
  lastExpectedMoveA21Bps?: string;
  finalPnl?: string; currentDrawdownPct: string; maxDrawdownPct: string; lastSignal?: string;
  lastError?: string; lastHeartbeatAt?: string; finalPosition?: unknown; summary?: Record<string, unknown>;
  buyExecuted: number; sellExecuted: number; orderCount: number; fillCount: number; riskEventCount: number;
};
type TestSummary = {
  finance?: Record<string, number>;
  strategy?: Record<string, number | null>;
  strategyRealistic?: Record<string, number | null>;
  strategyStress?: Record<string, number | null>;
  exits?: Record<string, number>;
  storage?: Record<string, number>;
  excursions?: Record<string, number | Record<string, unknown> | Array<Record<string, unknown>> | null>;
  filters?: Record<string, number>;
  comparison?: Record<string, number>;
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
  const { locale, t } = useI18n();
  const l = (pt: string, en: string, es: string) => locale === "en" ? en : locale === "es" ? es : pt;
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

  if (unauthorized) return <div className="panel" style={{ padding: 18 }}><p>{l("O painel do motor exige autenticação interna.", "The engine dashboard requires internal authentication.", "El panel del motor requiere autenticación interna.")}</p><Link className="btn" href="/login">{t("actions.enter")}</Link></div>;
  if (!bot) return <div className="panel" style={{ padding: 18 }}><p>{l("Nenhum bot persistido. O primeiro bot será criado em modo SIM.", "No persisted bot. The first bot will be created in SIM mode.", "No hay ningún robot persistido. El primero se creará en modo SIM.")}</p><button className="btn" disabled={busy} onClick={createBot}>{l("Criar bot EMA Cross SIM", "Create EMA Cross SIM bot", "Crear robot EMA Cross SIM")}</button>{message && <p className="pnlNeg">{message}</p>}</div>;

  const position = bot.positions[0];
  const lastOrder = bot.orders[0];
  const heartbeat = bot.runtime?.workerHeartbeatAt ? new Date(bot.runtime.workerHeartbeatAt).getTime() : 0;
  const workerOnline = now > 0 && now - heartbeat < 15_000;
  const samplingIntervalMs = Number(bot.strategyParams.samplingIntervalMs ?? 5_000);
  const samplingDescription = `Ticker · ${money(samplingIntervalMs / 1_000)} s (não candles)`;
  const elapsed = latestTest ? Math.max(0, (latestTest.completedAt ? new Date(latestTest.completedAt).getTime() : now) - new Date(latestTest.testStartedAt).getTime()) : 0;
  const remaining = activeTest ? Math.max(0, new Date(activeTest.testEndsAt).getTime() - now) : 0;
  const latestParams = (latestTest?.configuration?.strategyParams ?? bot.strategyParams) as Record<string, unknown>;
  const isA21 = String(latestParams.variant ?? bot.strategyParams.variant) === "A2.1";
  const warmupTarget = isA21 ? Math.ceil(15 * 60_000 / samplingIntervalMs) : Number(latestParams.longPeriod ?? 21);
  const currentEquity = latestTest ? currentEquityValue({
    currentEquity: latestTest.currentEquity === undefined ? null : Number(latestTest.currentEquity),
    finalEquity: latestTest.finalEquity === undefined ? null : Number(latestTest.finalEquity),
    initialEquity: Number(latestTest.initialEquity), realizedPnl: Number(latestTest.realizedPnl),
    unrealizedPnl: Number(latestTest.unrealizedPnl),
  }) : Number(bot.capitalUSDT);
  const testConfig = latestTest?.configuration ?? {};
  const strategyName = String(testConfig.strategyName ?? (bot.strategyParams.variant === "A2.1" ? "EMA 9/21 A2.1" : bot.strategyParams.variant === "A2" ? "EMA 9/21 A2" : "EMA 9/21 original"));
  const closedTrades = Math.max(0, latestTest?.sellExecuted ?? 0);
  const actualCost = Number(latestTest?.exchangeFeeActual ?? 0) + Number(latestTest?.actualSlippage ?? 0);
  const realisticCost = Number(latestTest?.realisticFee ?? 0) + Number(latestTest?.realisticSlippage ?? 0);
  const stressCost = Number(latestTest?.simulatedFee ?? 0) + Number(latestTest?.simulatedSlippage ?? 0);
  const displayedCostModel = (testConfig.costModel ?? {}) as Record<string, unknown>;
  const displayedMakerFeeBps = Number(displayedCostModel.simulatedMakerFeeBps ?? bot.strategyParams.simulatedMakerFeeBps ?? 10);
  const displayedTakerFeeBps = Number(displayedCostModel.simulatedTakerFeeBps ?? bot.strategyParams.simulatedTakerFeeBps ?? 10);
  const displayedSlippageBps = Number(displayedCostModel.simulatedSlippageBps ?? bot.strategyParams.simulatedSlippageBps ?? 5);
  const displayedRealisticTakerFeeBps = Number(displayedCostModel.realisticTakerFeeBps ?? bot.strategyParams.realisticTakerFeeBps ?? 2);
  const displayedRealisticSlippageBps = Number(displayedCostModel.realisticSlippageBps ?? bot.strategyParams.realisticSlippageBps ?? 1);

  return <div className="panel" style={{ padding: 14, display: "grid", gap: 16 }}>
    <div className="compactHeader">
      <div><div className="compactTitle">{bot.name}</div><small className="muted">{l("Teste persistente controlado pelo worker Railway", "Persistent test controlled by the Railway worker", "Prueba persistente controlada por el worker de Railway")}</small></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" disabled={busy || !activeTest} onClick={stopTest}>{l("Encerrar teste", "End test", "Finalizar prueba")}</button>
        <button className="btn" disabled={busy || !position} onClick={closePosition}>{l("Fechar posição", "Close position", "Cerrar posición")}</button>
        <button className="btn btnSell" disabled={busy} onClick={killSwitch}>Kill Switch</button>
      </div>
    </div>

    <section className="highlight" style={{ padding: 12 }}>
      <strong>{l("CONTROLE DO TESTE", "TEST CONTROL", "CONTROL DE PRUEBA")}</strong>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
        <label>{l("Duração", "Duration", "Duración")}<br/><select value={durationChoice} disabled={Boolean(activeTest)} onChange={(event) => setDurationChoice(event.target.value)}>
          <option value="1">1h</option><option value="6">6h</option><option value="12">12h</option><option value="24">24h</option><option value="custom">{l("Personalizada", "Custom", "Personalizada")}</option>
        </select></label>
        {durationChoice === "custom" && <label>Minutos (5–10080)<br/><input type="number" min={5} max={10080} value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value)}/></label>}
        <label style={{ flex: "1 1 360px" }}>{l("Frase de autorização", "Authorization phrase", "Frase de autorización")}<br/><input style={{ width: "100%" }} autoComplete="off" value={authorization} disabled={Boolean(activeTest)} onChange={(event) => setAuthorization(event.target.value)} placeholder={AUTHORIZATION}/></label>
        <button className="btn" disabled={busy || Boolean(activeTest) || bot.status !== "STOPPED"} onClick={startTest}>{l("INICIAR TESTE", "START TEST", "INICIAR PRUEBA")}</button>
      </div>
      {!activeTest && <small className="muted">Término previsto se iniciado agora: {projectedEnd}. O navegador pode ser fechado após a confirmação.</small>}
    </section>

    <HybridStrategyConfigurator botId={bot.id} botStatus={bot.status} currentPrice={Number(bot.runtime?.lastPrice ?? 0)} onChanged={load} />

    <section>
      <strong>{l("STATUS DO TESTE", "TEST STATUS", "ESTADO DE LA PRUEBA")} — {latestTest ? statusLabel[latestTest.status] : l("NÃO INICIADO", "NOT STARTED", "NO INICIADA")}</strong>
      {latestTest?.endedWithOpenPosition && <p className="pnlNeg">TESTE ENCERRADO — POSIÇÃO AINDA ABERTA</p>}
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <Metric label="Início" value={dateTime(latestTest?.testStartedAt)} /><Metric label="Término previsto" value={dateTime(latestTest?.testEndsAt)} />
        <Metric label="Tempo decorrido" value={latestTest ? duration(elapsed) : "—"} /><Metric label="Tempo restante" value={activeTest ? duration(remaining) : "—"} />
        <Metric label="Modo" value={latestTest?.mode ?? bot.mode} /><Metric label="Estratégia" value={strategyName} />
        <Metric label="Símbolo" value={latestTest?.symbol ?? bot.symbol} /><Metric label="Fonte de preço" value={samplingDescription} />
        <Metric label="Observações" value={String(latestTest?.observations ?? 0)} /><Metric label="Warm-up" value={`${Math.min(latestTest?.observations ?? 0, warmupTarget)}/${warmupTarget}`} />
        <Metric label="BUY / SELL / HOLD" value={`${latestTest?.buySignals ?? 0} / ${latestTest?.sellSignals ?? 0} / ${latestTest?.holdSignals ?? 0}`} />
        <Metric label="Ordens / Fills" value={`${latestTest?.orderCount ?? 0} / ${latestTest?.fillCount ?? 0}`} />
        <Metric label="Posições abertas" value={position ? "1" : "0"} /><Metric label="PNL realizado" value={`${money(latestTest?.realizedPnl)} USDT`} />
        <Metric label="PNL não realizado" value={`${money(latestTest?.unrealizedPnl)} USDT`} /><Metric label="Equity atual" value={`${money(currentEquity)} USDT`} />
        <Metric label="Peak Equity" value={`${money(latestTest?.peakEquity ?? bot.capitalUSDT)} USDT`} />
        <Metric label="PNL bruto" value={latestTest?.grossPnl === undefined ? "—" : `${money(latestTest.grossPnl)} USDT`} />
        <Metric label="Custo actual / realista / stress" value={`${money(actualCost)} / ${money(realisticCost)} / ${money(stressCost)} USDT`} />
        <Metric label="PNL líquido actual / realista / stress" value={`${money(latestTest?.actualNetPnl)} / ${money(latestTest?.realisticNetPnl)} / ${money(latestTest?.simulatedNetPnl)} USDT`} />
        <Metric label="Custo médio realista / stress" value={closedTrades ? `${money(realisticCost / closedTrades)} / ${money(stressCost / closedTrades)} USDT` : "—"} />
        <Metric label="MAE / MFE atual" value={position ? `${money(position.maeBps)} / ${money(position.mfeBps)} bps` : "—"} />
        <Metric label="Expected edge / range" value={`${money(latestTest?.lastExpectedMoveBps)} / ${money(latestTest?.lastRollingRangeBps)} bps`} />
        <Metric label="Separação EMA" value={`${money(latestTest?.lastEmaSeparationBps)} bps`} />
        {isA21 && <Metric label="Range ticker 2m / 5m / 15m" value={`${money(latestTest?.lastRange2mBps)} / ${money(latestTest?.lastRange5mBps)} / ${money(latestTest?.lastRange15mBps)} bps`} />}
        {isA21 && <Metric label="Momentum 2m / 5m / 15m" value={`${money(latestTest?.lastMomentum2mBps)} / ${money(latestTest?.lastMomentum5mBps)} / ${money(latestTest?.lastMomentum15mBps)} bps`} />}
        {isA21 && <Metric label="Expected move A2.1" value={`${money(latestTest?.lastExpectedMoveA21Bps)} bps`} />}
        <Metric label="Filtros edge / range / microcross" value={`${latestTest?.insufficientEdgeBlocks ?? 0} / ${latestTest?.insufficientRangeBlocks ?? 0} / ${latestTest?.microCrossoversFiltered ?? 0}`} />
        {isA21 && <Metric label="Filtros realista / range 5m / range 15m" value={`${latestTest?.insufficientRealisticEdgeBlocks ?? 0} / ${latestTest?.insufficient5mRangeBlocks ?? 0} / ${latestTest?.insufficient15mRangeBlocks ?? 0}`} />}
        <Metric label="Drawdown atual / máximo" value={`${money(latestTest?.currentDrawdownPct)}% / ${money(latestTest?.maxDrawdownPct)}%`} />
        <Metric label="Cooldown bloqueados" value={String(latestTest?.cooldownBlocks ?? 0)} /><Metric label="Eventos de risco" value={String(latestTest?.riskEventCount ?? 0)} />
        <Metric label="Último sinal" value={latestTest?.lastSignal ?? bot.runtime?.lastSignal ?? "—"} /><Metric label="Última ordem" value={lastOrder ? `${lastOrder.side} · ${lastOrder.status}` : "—"} />
        <Metric label="Último erro" value={latestTest?.lastError ?? bot.runtime?.lastError ?? "—"} /><Metric label="Heartbeat" value={`${workerOnline ? "RECENTE" : "SEM HEARTBEAT"} · ${dateTime(latestTest?.lastHeartbeatAt ?? bot.runtime?.workerHeartbeatAt)}`} />
      </div>
    </section>

    {bot.strategyParams.variant === "A2" && <section className="highlight" style={{ padding: 12 }}>
      <strong>EMA 9/21 A2 — THRESHOLDS DO TESTE</strong>
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 }}>
        <Metric label="MIN_EXPECTED_EDGE_BPS" value={money(bot.strategyParams.minExpectedEdgeBps as number)} />
        <Metric label="MIN_EMA_SEPARATION_BPS" value={money(bot.strategyParams.minEmaSeparationBps as number)} />
        <Metric label="MIN_ROLLING_RANGE_BPS" value={money(bot.strategyParams.minRollingRangeBps as number)} />
        <Metric label="Rolling window" value={`${money(bot.strategyParams.rollingRangeWindow as number)} ticks`} />
        <Metric label="Maker / Taker fee" value={`${money(displayedMakerFeeBps)} / ${money(displayedTakerFeeBps)} bps`} />
        <Metric label="Slippage simulado" value={`${money(displayedSlippageBps)} bps/lado`} />
      </div>
    </section>}

    {bot.strategyParams.variant === "A2.1" && <section className="highlight" style={{ padding: 12 }}>
      <strong>EMA 9/21 A2.1 — TICKER-BASED, NÃO CANDLES</strong>
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 }}>
        <Metric label="MIN_EXPECTED_EDGE_BPS" value={money(bot.strategyParams.minExpectedEdgeBps as number)} />
        <Metric label="MIN_EMA_SEPARATION_BPS" value={money(bot.strategyParams.minEmaSeparationBps as number)} />
        <Metric label="MIN_RANGE_5M_BPS" value={money(bot.strategyParams.minRange5mBps as number)} />
        <Metric label="MIN_RANGE_15M_BPS" value={money(bot.strategyParams.minRange15mBps as number)} />
        <Metric label="Custo realista (simulado laboratório)" value={`${money(displayedRealisticTakerFeeBps)} fee + ${money(displayedRealisticSlippageBps)} slippage bps/lado`} />
        <Metric label="Custo stress" value={`${money(displayedTakerFeeBps)} fee + ${money(displayedSlippageBps)} slippage bps/lado`} />
      </div>
      <small className="muted">Expected move = min(range15m, média(range5m, range15m)) × persistência direcional (0,4 / 0,6 / 0,8 / 1,0). O custo realista bloqueia entradas; stress é apenas telemetria.</small>
    </section>}

    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><span>{l("Par selecionado", "Selected pair", "Par seleccionado")}: {pair}</span><button className="btn" disabled={busy || pair === bot.symbol || Boolean(activeTest)} onClick={applyPair}>{l("Aplicar par ao bot", "Apply pair to bot", "Aplicar par al robot")}</button></div>
    {message && <p className={message.includes("iniciado") ? "pnlPos" : "pnlNeg"}>{message}</p>}

    <section><strong>{l("HISTÓRICO DE TESTES", "TEST HISTORY", "HISTORIAL DE PRUEBAS")}</strong>{tests.length ? tests.map((test) => {
      const summary = (test.summary ?? {}) as TestSummary;
      const finance = summary.finance ?? {};
      const strategy = summary.strategy ?? {};
      const strategyRealistic = summary.strategyRealistic ?? strategy;
      const strategyStress = summary.strategyStress ?? strategy;
      const exits = summary.exits ?? {};
      const storage = summary.storage ?? {};
      const excursions = summary.excursions ?? {};
      const filters = summary.filters ?? {};
      const comparison = summary.comparison ?? {};
      return <details key={test.id} style={{ marginTop: 8 }}>
      <summary>{dateTime(test.testStartedAt)} · {test.durationMinutes} min · {String(test.configuration.strategyName ?? test.strategy)} · {test.symbol} · {statusLabel[test.status]} · PNL {money(test.finalPnl ?? test.realizedPnl)} USDT · DD {money(test.maxDrawdownPct)}% · {test.buyExecuted + test.sellExecuted} trades</summary>
      <div className="highlight" style={{ marginTop: 6, padding: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
        <Metric label="Duração real" value={duration(test.actualDurationMs ?? 0)} /><Metric label="Motivo" value={test.stopReason ?? "—"} />
        <Metric label="Cruzamentos" value={String(test.crossoverCount)} /><Metric label="BUY executados / bloqueados" value={`${test.buyExecuted} / ${test.buyBlocked}`} />
        <Metric label="SELL executados / ignorados" value={`${test.sellExecuted} / ${test.sellIgnored}`} /><Metric label="Equity inicial / final" value={`${money(test.initialEquity)} / ${money(test.finalEquity)} USDT`} />
        <Metric label="Erros" value={String(test.errorCount)} /><Metric label="Posição final" value={test.endedWithOpenPosition ? "ABERTA" : "ZERADA"} />
      </div>
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
        <MetricBlock title="FINANCEIRO" rows={[
          ["PNL bruto", finance.grossPnl], ["Custo actual", finance.totalActualCost], ["Custo realista", finance.totalRealisticCost], ["Custo stress", finance.totalSimulatedCost],
          ["PNL líquido actual", finance.actualNetPnl], ["PNL líquido realista", finance.realisticNetPnl], ["PNL líquido stress", finance.simulatedNetPnl],
          ["Custo médio realista/trade", finance.averageRealisticCostPerTrade], ["Custo médio stress/trade", finance.averageCostPerTrade],
        ]} suffix=" USDT" />
        <MetricBlock title="ESTRATÉGIA — REALISTA / STRESS" rows={[
          ["Win rate realista / stress", `${money(strategyRealistic.winRatePct as number)} / ${money(strategyStress.winRatePct as number)}%`],
          ["Profit factor realista / stress", `${money(strategyRealistic.profitFactor as number)} / ${money(strategyStress.profitFactor as number)}`],
          ["Payoff realista / stress", `${money(strategyRealistic.payoffRatio as number)} / ${money(strategyStress.payoffRatio as number)}`],
          ["Expectancy realista / stress", `${money(strategyRealistic.expectancy as number)} / ${money(strategyStress.expectancy as number)} USDT`],
          ["Seq. ganhos/perdas (realista)", `${strategyRealistic.maxWinStreak ?? 0} / ${strategyRealistic.maxLossStreak ?? 0}`],
        ]} />
        <MetricBlock title="SAÍDAS" rows={[
          ["EMA crossover", exits.emaCrossover], ["Take profit", exits.takeProfit], ["Stop loss", exits.stopLoss],
          ["Risk exit", exits.riskExit], ["Manual", exits.manual], ["Outro", exits.other],
        ]} />
        <MetricBlock title="MAE / MFE" rows={[
          ["MAE médio", excursions.averageMaeBps as number], ["MAE máximo", excursions.maxMaeBps as number],
          ["MFE médio", excursions.averageMfeBps as number], ["MFE máximo", excursions.maxMfeBps as number],
          ["Eficiência média de saída", excursions.averageExitEfficiencyPct as number],
          ["Giveback médio", excursions.averageProfitGivebackBps as number],
          ["Top 5 MFE desperdiçado", Array.isArray(excursions.topMfeWastedTrades) ? excursions.topMfeWastedTrades.map((item) => `${String(item.orderId).slice(0, 8)}:${money(item.profitGivebackBps as number)}bps`).join(" · ") || "—" : "—"],
        ]} />
        <MetricBlock title="FILTROS" rows={[
          ["BUY totais / executados", `${filters.buySignals ?? 0} / ${filters.buyExecuted ?? 0}`],
          ["Cooldown", filters.cooldownBlocks], ["Edge insuficiente", filters.insufficientExpectedEdge],
          ["Range insuficiente", filters.insufficientMarketRange], ["Microcrossovers", filters.microCrossoversFiltered],
          ["Edge realista insuficiente", filters.insufficientRealisticEdge], ["Range 5m insuficiente", filters.insufficient5mRange],
          ["Range 15m insuficiente", filters.insufficient15mRange],
          ["SELL executados / ignorados", `${filters.sellExecuted ?? 0} / ${filters.sellIgnoredWithoutPosition ?? 0}`],
          ["Executadas que A2 bloquearia", comparison.a2WouldHaveBlockedExecutedBuys],
        ]} />
        <MetricBlock title="STORAGE / TELEMETRIA" rows={[
          ["Linhas de snapshot", storage.balanceSnapshotRows], ["Média por hora", storage.averageRowsPerHour],
          ["Estimativa por dia", storage.estimatedRowsPerDay], ["Volume estimado/dia", storage.estimatedPayloadBytesPerDay === undefined ? undefined : `${money(storage.estimatedPayloadBytesPerDay / 1_000_000)} MB`],
        ]} />
      </div>
    </details>}) : <div className="muted">{l("Nenhum teste registrado.", "No test recorded.", "Ninguna prueba registrada.")}</div>}</section>

    <section><strong>{l("Logs recentes", "Recent logs", "Logs recientes")}</strong>{bot.logs.length ? bot.logs.map((log) => <div key={log.id} className="muted">{dateTime(log.createdAt)} · {log.level} · {log.message}</div>) : <div className="muted">{l("Sem logs.", "No logs.", "Sin logs.")}</div>}</section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><small className="muted">{label}</small><div className="bold" style={{ overflowWrap: "anywhere" }}>{value}</div></div>;
}

function MetricBlock({ title, rows, suffix = "" }: { title: string; rows: Array<[string, number | string | null | undefined]>; suffix?: string }) {
  return <div className="highlight" style={{ padding: 10 }}><strong>{title}</strong>{rows.map(([label, value]) =>
    <Metric key={label} label={label} value={typeof value === "string" ? value : value === null || value === undefined ? "—" : `${money(value)}${suffix}`} />
  )}</div>;
}
