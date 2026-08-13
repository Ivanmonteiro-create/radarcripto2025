"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";

type Level = { levelNumber: number; entryPrice: number; targetPrice: number; quoteAmount: number; enabled: boolean; repeat: boolean };
type SymbolInfo = { symbol: string; baseAsset: string; quoteAsset: string; status: string; filter: { tickSize: number; stepSize: number; minQuantity: number; minNotional: number } };
type Validation = { valid: boolean; errors: string[]; warnings: string[]; committedQuote: number; availableQuote: number; economics: Array<{ levelNumber: number; grossProfitQuote: number; simulatedCostsQuote: number; estimatedNetProfitQuote: number; grossDistancePct: number; belowEstimatedCosts: boolean }> };
type CycleOrder = { id: string; clientOrderId: string; exchangeOrderId?: string | null; status: string; side: string; requestedPrice?: string | null; averageFillPrice?: string | null; createdAt: string; updatedAt: string };
type Cycle = { id: string; levelId: string; status: string; averageBuyPrice?: string | null; averageSellPrice?: string | null; openedAt?: string | null; closedAt?: string | null; createdAt: string; updatedAt: string; orders: CycleOrder[] };
type LevelRecord = {
  id: string; levelNumber: number; entryPrice: string; targetPrice: string; quoteAmount: string; enabled: boolean; repeat: boolean; updatedAt: string;
  runtime?: { state: string; activeOrderId?: string | null; completedCycles: number; grossPnl: string; fees: string; slippage: string; netPnl: string; heldQuantity: string; committedQuote: string; totalHoldingMs: string; lastTransitionAt: string; updatedAt: string };
};
type ConfigRecord = {
  id: string; version: number; status: string; isCurrent: boolean; mode: string; name: string; symbol: string;
  capitalTotal: string; maxCommitted: string; maxExposure: string; structuralStop: string;
  simulatedMakerFeeBps: string; simulatedSlippageBps: string; updatedAt: string;
  levels: LevelRecord[]; cycles: Cycle[];
};

const AUTHORIZATION = "I_AUTHORIZE_BINANCE_SPOT_TESTNET_STRATEGY_B_START";
const initialLevels: Level[] = [{ levelNumber: 1, entryPrice: 63600, targetPrice: 64200, quoteAmount: 6, enabled: true, repeat: true }];
const n = (value: number) => Number.isFinite(value) ? value : 0;
const number = (value: string | number | null | undefined) => Number(value ?? 0);
const price = (value: string | number | null | undefined) => number(value).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
const quote = (value: string | number | null | undefined) => number(value).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const pct = (value: number | null) => value === null || !Number.isFinite(value) ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(3)}%`;
const elapsed = (from?: string | null, until?: string | null) => {
  if (!from) return "—";
  const milliseconds = Math.max(0, new Date(until ?? Date.now()).getTime() - new Date(from).getTime());
  const seconds = Math.floor(milliseconds / 1_000);
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

export default function HybridStrategyConfigurator({ botId, botStatus, currentPrice, onChanged }: { botId: string; botStatus: string; currentPrice: number; onChanged: () => Promise<void> }) {
  const { locale, t } = useI18n();
  const l = (pt: string, en: string, es: string) => locale === "en" ? en : locale === "es" ? es : pt;
  const [mode, setMode] = useState<"READY" | "CUSTOM">("READY");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [query, setQuery] = useState("BTC");
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [capitalTotal, setCapitalTotal] = useState(100);
  const [maxCommitted, setMaxCommitted] = useState(60);
  const [maxExposure, setMaxExposure] = useState(60);
  const [structuralStop, setStructuralStop] = useState(59000);
  const [makerFeeBps, setMakerFeeBps] = useState(10);
  const [slippageBps, setSlippageBps] = useState(5);
  const [acceptCostWarning, setAcceptCostWarning] = useState(false);
  const [levels, setLevels] = useState<Level[]>(initialLevels);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [configs, setConfigs] = useState<ConfigRecord[]>([]);
  const [authorization, setAuthorization] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const payload = useMemo(() => ({ mode, name: mode === "READY" ? "Range / Ciclo de Preço B" : "Estratégia personalizada de níveis", symbol, capitalTotal, maxCommitted, maxExposure, structuralStop, simulatedMakerFeeBps: makerFeeBps, simulatedSlippageBps: slippageBps, costWarningAccepted: acceptCostWarning, levels }), [mode, symbol, capitalTotal, maxCommitted, maxExposure, structuralStop, makerFeeBps, slippageBps, acceptCostWarning, levels]);
  const committed = levels.filter((level) => level.enabled).reduce((sum, level) => sum + level.quoteAmount, 0);

  const loadConfigs = useCallback(async () => {
    const response = await fetch(`/api/bots/${botId}/strategy-config`, { cache: "no-store" });
    if (response.ok) setConfigs(((await response.json()) as { configurations: ConfigRecord[] }).configurations);
  }, [botId]);
  useEffect(() => {
    const initial = window.setTimeout(() => { void loadConfigs(); }, 0);
    const timer = window.setInterval(() => { void loadConfigs(); }, 3_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [loadConfigs]);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/spot-symbols?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      if (response.ok) setSymbols(((await response.json()) as { symbols: SymbolInfo[] }).symbols);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const changeLevel = (index: number, patch: Partial<Level>) => setLevels((current) => current.map((level, item) => item === index ? { ...level, ...patch } : level));
  const addLevel = () => setLevels((current) => current.length >= 10 ? current : [...current, { levelNumber: current.length + 1, entryPrice: current.at(-1)?.entryPrice ? current.at(-1)!.entryPrice - 100 : 1, targetPrice: current.at(-1)?.targetPrice ? current.at(-1)!.targetPrice + 100 : 2, quoteAmount: 6, enabled: true, repeat: true }]);
  const removeLevel = (index: number) => setLevels((current) => current.filter((_level, item) => item !== index).map((level, item) => ({ ...level, levelNumber: item + 1 })));

  async function submit(kind: "validate" | "save") {
    setBusy(true); setMessage(""); setValidation(null);
    const response = await fetch(`/api/bots/${botId}/strategy-config${kind === "validate" ? "/validate" : ""}`, { method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify(payload) });
    const result = await response.json() as { validation?: Validation; error?: string };
    setBusy(false);
    if (result.validation) setValidation(result.validation);
    setMessage(response.ok ? kind === "validate" ? "Validação concluída. Nenhuma execução foi iniciada." : "Nova versão salva. O robô permanece parado." : result.error ?? "Falha na configuração.");
    if (response.ok && kind === "save") await loadConfigs();
  }

  async function start() {
    const current = configs.find((config) => config.isCurrent && config.status === "VALIDATED");
    if (!current || authorization !== AUTHORIZATION) return setMessage("Valide/salve uma configuração e digite a frase exata.");
    setBusy(true);
    const response = await fetch(`/api/bots/${botId}/strategy-config/start`, { method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ authorization, configurationId: current.id }) });
    setBusy(false); setMessage(response.ok ? "Estratégia B iniciada em Testnet." : ((await response.json()) as { error?: string }).error ?? "Início recusado.");
    if (response.ok) await onChanged();
  }

  async function stop() {
    if (!window.confirm("Parar a Estratégia B e cancelar ordens pendentes após reconciliação?")) return;
    setBusy(true);
    const response = await fetch(`/api/bots/${botId}/strategy-config/stop`, { method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ confirmation: true }) });
    setBusy(false); setMessage(response.ok ? "Robô parado com segurança." : "Falha ao parar o robô.");
    await onChanged(); await loadConfigs();
  }

  const currentConfig = configs.find((config) => config.isCurrent) ?? null;

  return <section className="highlight" style={{ padding: 14, display: "grid", gap: 12 }}>
    <div><strong>{l("RASCUNHO DE EDIÇÃO", "EDITING DRAFT", "BORRADOR DE EDICIÓN")}</strong><div className="muted">{l("Os campos abaixo não representam necessariamente o que o worker executa. A configuração realmente salva aparece no bloco separado.", "The fields below do not necessarily represent what the worker runs. The actually saved configuration is shown separately.", "Los campos siguientes no representan necesariamente lo que ejecuta el worker. La configuración guardada aparece por separado.")}</div></div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button className="btn" type="button" onClick={() => setMode("READY")} aria-pressed={mode === "READY"}>{l("Estratégia Pronta", "Ready Strategy", "Estrategia Lista")}</button>
      <button className="btn" type="button" onClick={() => setMode("CUSTOM")} aria-pressed={mode === "CUSTOM"}>{l("Estratégia Personalizada", "Custom Strategy", "Estrategia Personalizada")}</button>
    </div>
    <div className="muted">{mode === "READY" ? "Estratégia B — Range / Ciclo de Preço: compra e vende por níveis configurados, sem saída por EMA." : "Regra simples: preço X → comprar Y; preço Z → vender; stop W; repetir opcionalmente."}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
      <label>{l("Pesquisar par Testnet", "Search Testnet pair", "Buscar par Testnet")}<br/><input value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} placeholder="BTC, ETH, LINK..." /></label>
      <label>{l("Par ativo", "Active pair", "Par activo")}<br/><select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{symbols.length ? symbols.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol}</option>) : <option value={symbol}>{symbol}</option>}</select></label>
      <label>Capital total (USDT)<br/><input type="number" min="0" step="0.01" value={capitalTotal} onChange={(event) => setCapitalTotal(n(event.target.valueAsNumber))}/></label>
      <label>Máximo comprometido<br/><input type="number" min="0" step="0.01" value={maxCommitted} onChange={(event) => setMaxCommitted(n(event.target.valueAsNumber))}/></label>
      <label>Exposição máxima<br/><input type="number" min="0" step="0.01" value={maxExposure} onChange={(event) => setMaxExposure(n(event.target.valueAsNumber))}/></label>
      <label>Stop estrutural<br/><input type="number" min="0" step="0.01" value={structuralStop} onChange={(event) => setStructuralStop(n(event.target.valueAsNumber))}/></label>
      <label>Fee maker simulada (bps/lado)<br/><input type="number" min="0" step="0.1" value={makerFeeBps} onChange={(event) => setMakerFeeBps(n(event.target.valueAsNumber))}/></label>
      <label>Slippage simulado (bps/lado)<br/><input type="number" min="0" step="0.1" value={slippageBps} onChange={(event) => setSlippageBps(n(event.target.valueAsNumber))}/></label>
    </div>
    <div><strong>NÍVEIS ({levels.length}/10)</strong>{levels.map((level, index) => <div key={level.levelNumber} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 8, padding: 10, border: "1px solid rgba(24,226,115,.2)", borderRadius: 10 }}>
      <strong>#{level.levelNumber}</strong>
      <label>{t("actions.buy")}<br/><input type="number" step="0.01" value={level.entryPrice} onChange={(event) => changeLevel(index, { entryPrice: n(event.target.valueAsNumber) })}/></label>
      <label>{t("actions.sell")}<br/><input type="number" step="0.01" value={level.targetPrice} onChange={(event) => changeLevel(index, { targetPrice: n(event.target.valueAsNumber) })}/></label>
      <label>Valor USDT<br/><input type="number" step="0.01" value={level.quoteAmount} onChange={(event) => changeLevel(index, { quoteAmount: n(event.target.valueAsNumber) })}/></label>
      <label><input type="checkbox" checked={level.enabled} onChange={(event) => changeLevel(index, { enabled: event.target.checked })}/> Ativo</label>
      <label><input type="checkbox" checked={level.repeat} onChange={(event) => changeLevel(index, { repeat: event.target.checked })}/> Repetir</label>
      <button className="btn" type="button" disabled={levels.length === 1} onClick={() => removeLevel(index)}>Remover</button>
    </div>)}</div>
    <button className="btn" type="button" disabled={levels.length >= 10} onClick={addLevel}>+ ADICIONAR NÍVEL</button>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
      <Metric label="Capital total" value={`${capitalTotal.toFixed(2)} USDT`}/><Metric label="Capital comprometido" value={`${committed.toFixed(2)} USDT`}/><Metric label="Capital disponível" value={`${(capitalTotal - committed).toFixed(2)} USDT`}/>
      <Metric label="Margem bruta estimada" value={`${(validation?.economics.reduce((sum, item) => sum + item.grossProfitQuote, 0) ?? 0).toFixed(6)} USDT`}/><Metric label="Custos simulados" value={`${(validation?.economics.reduce((sum, item) => sum + item.simulatedCostsQuote, 0) ?? 0).toFixed(6)} USDT`}/><Metric label="Margem líquida estimada" value={`${(validation?.economics.reduce((sum, item) => sum + item.estimatedNetProfitQuote, 0) ?? 0).toFixed(6)} USDT`}/>
    </div>
    {validation && <div className={validation.valid ? "pnlPos" : "pnlNeg"}>{validation.valid ? "ESTRATÉGIA VÁLIDA" : `BLOQUEADA: ${validation.errors.join(" · ")}`}{validation.warnings.length ? <div>Alertas: {validation.warnings.join(" · ")}</div> : null}</div>}
    <label><input type="checkbox" checked={acceptCostWarning} onChange={(event) => setAcceptCostWarning(event.target.checked)}/> Confirmo alvos com margem inferior aos custos simulados, se houver (somente Testnet).</label>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn" disabled={busy || botStatus === "RUNNING"} onClick={() => void submit("save")}>{t("bots.save").toUpperCase()}</button><button className="btn" disabled={busy || botStatus === "RUNNING"} onClick={() => void submit("validate")}>{l("VALIDAR ESTRATÉGIA", "VALIDATE STRATEGY", "VALIDAR ESTRATEGIA")}</button></div>
    <label>{l("Frase de autorização para iniciar", "Authorization phrase to start", "Frase de autorización para iniciar")}<br/><input style={{ width: "100%" }} value={authorization} onChange={(event) => setAuthorization(event.target.value)} placeholder={AUTHORIZATION}/></label>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn" disabled={busy || botStatus !== "STOPPED" || authorization !== AUTHORIZATION} onClick={start}>{l("INICIAR TESTE — ESTRATÉGIA B", "START TEST — STRATEGY B", "INICIAR PRUEBA — ESTRATEGIA B")}</button><button className="btn btnSell" disabled={busy || botStatus === "STOPPED"} onClick={stop}>{t("bots.stop").toUpperCase()}</button></div>
    <small className="muted">A opção futura “Sugerir parâmetros com IA” permanece apenas reservada; IA não altera nem inicia esta estratégia.</small>
    {currentConfig && <ActiveConfiguration config={currentConfig} currentPrice={currentPrice} l={l} />}
    {configs.length > 0 && <div style={{ display: "grid", gap: 8 }}><strong>{l("VERSÕES E MÉTRICAS POR NÍVEL", "VERSIONS AND METRICS BY LEVEL", "VERSIONES Y MÉTRICAS POR NIVEL")}</strong>{configs.slice(0, 5).map((config) => <details key={config.id} open={config.isCurrent}><summary>v{config.version} · {config.mode} · {config.symbol} · {config.status}{config.isCurrent ? ` · ${l("ATUAL", "CURRENT", "ACTUAL")}` : ""}</summary><div style={{ display: "grid", gap: 8, marginTop: 8 }}>{config.levels.map((level) => <LevelMetrics key={level.id} config={config} level={level} currentPrice={currentPrice} l={l} />)}</div></details>)}</div>}
    {message && <div className="muted">{message}</div>}
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><small className="muted">{label}</small><div className="bold">{value}</div></div>; }

function ActiveConfiguration({ config, currentPrice, l }: { config: ConfigRecord; currentPrice: number; l: (pt: string, en: string, es: string) => string }) {
  return <section style={{ padding: 12, border: "1px solid rgba(24,226,115,.45)", borderRadius: 12, background: "rgba(0,35,18,.35)" }}>
    <strong>{l("CONFIGURAÇÃO SALVA / ATIVA", "SAVED / ACTIVE CONFIGURATION", "CONFIGURACIÓN GUARDADA / ACTIVA")}</strong>
    <div className="muted">{l("Fonte de verdade persistida usada pelo worker; não é o formulário acima.", "Persisted source of truth used by the worker; this is not the form above.", "Fuente de verdad persistida usada por el worker; no es el formulario anterior.")}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 8, marginTop: 10 }}>
      <Metric label={l("Versão", "Version", "Versión")} value={`v${config.version}`} />
      <Metric label={l("Par", "Pair", "Par")} value={config.symbol} />
      <Metric label={l("Capital", "Capital", "Capital")} value={`${quote(config.capitalTotal)} USDT`} />
      <Metric label={l("Máximo comprometido", "Maximum committed", "Máximo comprometido")} value={`${quote(config.maxCommitted)} USDT`} />
      <Metric label={l("Exposição máxima", "Maximum exposure", "Exposición máxima")} value={`${quote(config.maxExposure)} USDT`} />
      <Metric label={l("Stop estrutural", "Structural stop", "Stop estructural")} value={price(config.structuralStop)} />
      <Metric label={l("Níveis ativos", "Active levels", "Niveles activos")} value={String(config.levels.filter((level) => level.enabled).length)} />
      <Metric label={l("Preço atual", "Current price", "Precio actual")} value={currentPrice > 0 ? price(currentPrice) : "—"} />
      <Metric label="Status" value={config.status} />
    </div>
  </section>;
}

function LevelMetrics({ config, level, currentPrice, l }: { config: ConfigRecord; level: LevelRecord; currentPrice: number; l: (pt: string, en: string, es: string) => string }) {
  const runtime = level.runtime;
  const cycles = config.cycles.filter((cycle) => cycle.levelId === level.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestCycle = cycles[0];
  const orders = cycles.flatMap((cycle) => cycle.orders).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeOrder = orders.find((order) => ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"].includes(order.status)) ?? orders[0];
  const entry = number(level.entryPrice);
  const target = number(level.targetPrice);
  const held = number(runtime?.heldQuantity);
  const configuredQuantity = entry > 0 ? number(level.quoteAmount) / entry : 0;
  const distanceToBuy = currentPrice > 0 ? (entry / currentPrice - 1) * 100 : null;
  const distanceToSell = currentPrice > 0 && held > 0 ? (target / currentPrice - 1) * 100 : null;
  const openedAt = latestCycle?.openedAt ?? (held > 0 ? latestCycle?.createdAt : null);
  const costs = number(runtime?.fees) + number(runtime?.slippage);
  return <article style={{ padding: 10, border: "1px solid rgba(24,226,115,.22)", borderRadius: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><strong>{l("NÍVEL", "LEVEL", "NIVEL")} {level.levelNumber}</strong><strong>{runtime?.state ?? "WAITING_BUY"}</strong></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 8, marginTop: 8 }}>
      <Metric label={l("BUY configurado", "Configured BUY", "BUY configurado")} value={price(entry)} />
      <Metric label={l("SELL configurado", "Configured SELL", "SELL configurado")} value={price(target)} />
      <Metric label={l("Preço atual", "Current price", "Precio actual")} value={currentPrice > 0 ? price(currentPrice) : "—"} />
      <Metric label={l("Distância até BUY", "Distance to BUY", "Distancia a BUY")} value={pct(distanceToBuy)} />
      <Metric label={l("Quantidade", "Quantity", "Cantidad")} value={`${number(held || configuredQuantity).toFixed(8)} BTC`} />
      <Metric label={l("Valor", "Value", "Valor")} value={`${quote(level.quoteAmount)} USDT`} />
      <Metric label={l("Capital comprometido", "Committed capital", "Capital comprometido")} value={`${quote(runtime?.committedQuote)} USDT`} />
      <Metric label="Order ID" value={activeOrder?.exchangeOrderId ?? activeOrder?.clientOrderId ?? runtime?.activeOrderId ?? "—"} />
      <Metric label={l("Preço real de entrada", "Actual entry price", "Precio real de entrada")} value={latestCycle?.averageBuyPrice ? price(latestCycle.averageBuyPrice) : "—"} />
      <Metric label={l("Preço alvo", "Target price", "Precio objetivo")} value={price(target)} />
      <Metric label={l("Distância até SELL", "Distance to SELL", "Distancia a SELL")} value={pct(distanceToSell)} />
      <Metric label={l("PNL bruto", "Gross PNL", "PNL bruto")} value={`${quote(runtime?.grossPnl)} USDT`} />
      <Metric label={l("Custos simulados", "Simulated costs", "Costes simulados")} value={`${quote(costs)} USDT`} />
      <Metric label={l("PNL líquido", "Net PNL", "PNL neto")} value={`${quote(runtime?.netPnl)} USDT`} />
      <Metric label={l("Tempo aberto", "Open time", "Tiempo abierto")} value={elapsed(openedAt, latestCycle?.closedAt)} />
      <Metric label={l("Número de ciclos", "Cycle count", "Número de ciclos")} value={String(runtime?.completedCycles ?? 0)} />
      <Metric label={l("Última atualização", "Last update", "Última actualización")} value={new Date(runtime?.updatedAt ?? level.updatedAt).toLocaleString("pt-PT")} />
    </div>
  </article>;
}
