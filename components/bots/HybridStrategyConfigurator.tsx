"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";

type Level = { levelNumber: number; entryPrice: number; targetPrice: number; quoteAmount: number; enabled: boolean; repeat: boolean };
type SymbolInfo = { symbol: string; baseAsset: string; quoteAsset: string; status: string; filter: { tickSize: number; stepSize: number; minQuantity: number; minNotional: number } };
type Validation = { valid: boolean; errors: string[]; warnings: string[]; committedQuote: number; availableQuote: number; economics: Array<{ levelNumber: number; grossProfitQuote: number; simulatedCostsQuote: number; estimatedNetProfitQuote: number; grossDistancePct: number; belowEstimatedCosts: boolean }> };
type ConfigRecord = { id: string; version: number; status: string; isCurrent: boolean; mode: string; symbol: string; levels: Array<{ levelNumber: number; runtime?: { state: string; completedCycles: number; grossPnl: string; fees: string; slippage: string; netPnl: string; heldQuantity: string; committedQuote: string; totalHoldingMs: string } }> };

const AUTHORIZATION = "I_AUTHORIZE_BINANCE_SPOT_TESTNET_STRATEGY_B_START";
const initialLevels: Level[] = [{ levelNumber: 1, entryPrice: 63600, targetPrice: 64200, quoteAmount: 6, enabled: true, repeat: true }];
const n = (value: number) => Number.isFinite(value) ? value : 0;

export default function HybridStrategyConfigurator({ botId, botStatus, onChanged }: { botId: string; botStatus: string; onChanged: () => Promise<void> }) {
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
    const timer = window.setTimeout(() => { void loadConfigs(); }, 0);
    return () => window.clearTimeout(timer);
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

  return <section className="highlight" style={{ padding: 14, display: "grid", gap: 12 }}>
    <div><strong>{l("CRIAR / CONFIGURAR ROBÔ", "CREATE / CONFIGURE BOT", "CREAR / CONFIGURAR ROBOT")}</strong><div className="muted">{l("Estratégia persistida e versionada. SALVAR ≠ INICIAR. Binance Spot Testnet apenas.", "Persisted, versioned strategy. SAVE ≠ START. Binance Spot Testnet only.", "Estrategia persistida y versionada. GUARDAR ≠ INICIAR. Solo Binance Spot Testnet.")}</div></div>
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
    {configs.length > 0 && <div><strong>VERSÕES E MÉTRICAS POR NÍVEL</strong>{configs.slice(0, 5).map((config) => <details key={config.id}><summary>v{config.version} · {config.mode} · {config.symbol} · {config.status}{config.isCurrent ? " · ATUAL" : ""}</summary>{config.levels.map((level) => <div key={level.levelNumber} className="muted">Nível {level.levelNumber}: {level.runtime?.state ?? "WAITING_BUY"} · ciclos {level.runtime?.completedCycles ?? 0} · PNL líquido {Number(level.runtime?.netPnl ?? 0).toFixed(6)} USDT · comprometido {Number(level.runtime?.committedQuote ?? 0).toFixed(2)} USDT</div>)}</details>)}</div>}
    {message && <div className="muted">{message}</div>}
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><small className="muted">{label}</small><div className="bold">{value}</div></div>; }
