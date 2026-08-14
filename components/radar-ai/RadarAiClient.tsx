"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RADAR_SYMBOLS, type MarketSnapshot, type RadarAnalysisResult } from "@/lib/radar-ai/contracts";
import { useI18n } from "@/components/i18n/LocaleProvider";

type Analysis = {
  id: string;
  symbol: string;
  status: string;
  price: number;
  marketDataSource: string;
  marketSnapshot: MarketSnapshot;
  result: RadarAnalysisResult | null;
  promptVersion: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
  errorCode: string | null;
  createdAt: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  MARKET_DATA_TIMEOUT: "A consulta à Binance Spot Testnet excedeu o tempo limite.",
  MARKET_DATA_UNAVAILABLE: "Os dados da Binance Spot Testnet estão temporariamente indisponíveis.",
  MARKET_DATA_INVALID: "A fonte retornou dados de mercado inválidos.",
  RADAR_AI_NOT_CONFIGURED: "Radar IA não configurado neste ambiente.",
  RADAR_AI_RATE_LIMITED: "Aguarde antes de solicitar outra análise para este ativo.",
  RADAR_AI_DAILY_LIMIT_REACHED: "O limite diário configurado para o Radar IA foi atingido.",
  AI_TIMEOUT: "A análise da IA excedeu o tempo limite.",
  AI_RATE_LIMITED: "O serviço de IA aplicou um limite temporário. Tente novamente depois.",
  AI_INVALID_RESPONSE: "A resposta da IA não respeitou o formato seguro e foi rejeitada.",
  AI_UNAVAILABLE: "O serviço de IA está temporariamente indisponível.",
};

function localeTag(locale: string) { return locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-GB"; }
function number(value: number, digits = 2, locale = "pt") {
  return value.toLocaleString(localeTag(locale), { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

function date(value: string, locale = "pt") {
  return new Date(value).toLocaleString(localeTag(locale));
}

function zonesText(zones: RadarAnalysisResult["supportZones"], locale = "pt") {
  return zones.length ? zones.map((zone) => `${number(zone.low, 8, locale)} — ${number(zone.high, 8, locale)} (${zone.touches} ${locale === "en" ? "tests" : locale === "es" ? "pruebas" : "testes"})`).join("\n") : locale === "en" ? "No relevant zone in the sample." : locale === "es" ? "Ninguna zona relevante en la muestra." : "Nenhuma zona relevante na amostra.";
}

function copyText(analysis: Analysis, locale: string) {
  const result = analysis.result;
  if (!result) return "";
  return [
    `RADAR IA · ${result.asset}`,
    `${locale === "en" ? "Date" : locale === "es" ? "Fecha" : "Data"}: ${date(analysis.createdAt, locale)}`,
    `${locale === "en" ? "Price" : locale === "es" ? "Precio" : "Preço"}: ${number(analysis.price, 8, locale)} USDT`,
    `Regime: ${result.regime} · Confiança: ${result.confidence}`,
    `Faixa atual: ${number(result.currentRange.low, 8)} — ${number(result.currentRange.high, 8)} USDT`,
    `Support:\n${zonesText(result.supportZones, locale)}`,
    `Resistance:\n${zonesText(result.resistanceZones, locale)}`,
    `Volatilidade: ${result.volatility.summary}`,
    `Adequação range: ${result.rangeSuitability}`,
    `Adequação tendência: ${result.trendSuitability}`,
    `Fatos: ${result.factsSummary}`,
    `Leitura: ${result.marketReading}`,
    `Riscos:\n${result.risks.map((risk) => `- ${risk}`).join("\n")}`,
    `Observação: ${result.observation}`,
    result.disclaimer,
  ].join("\n\n");
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw Object.assign(new Error(body.error ?? "INTERNAL_ERROR"), { status: response.status });
  return body as T;
}

export default function RadarAiClient() {
  const { locale, t } = useI18n();
  const [symbol, setSymbol] = useState<(typeof RADAR_SYMBOLS)[number]>("BTCUSDT");
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [selected, setSelected] = useState<Analysis | null>(null);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (asset: string) => {
    try {
      const [market, records] = await Promise.all([
        api<{ snapshot: MarketSnapshot; aiConfigured: boolean }>(`/api/radar-ia/market?symbol=${asset}`),
        api<{ analyses: Analysis[] }>(`/api/radar-ia/analyses?symbol=${asset}&locale=${locale}`),
      ]);
      setSnapshot(market.snapshot);
      setAiConfigured(market.aiConfigured);
      setHistory(records.analyses);
      setSelected(records.analyses.find((item) => item.status === "SUCCESS") ?? null);
      setUnauthorized(false);
    } catch (loadError) {
      const code = loadError instanceof Error ? loadError.message : "INTERNAL_ERROR";
      if (typeof loadError === "object" && loadError && "status" in loadError && loadError.status === 401) setUnauthorized(true);
      setError(ERROR_MESSAGES[code] ?? "Não foi possível carregar o Radar IA.");
    } finally {
      setLoadingMarket(false);
    }
  }, [locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(symbol), 0);
    return () => window.clearTimeout(timer);
  }, [load, symbol]);

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    setCopied(false);
    try {
      const body = await api<{ analysis: Analysis }>("/api/radar-ia/analyses", {
        method: "POST",
        headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" },
        body: JSON.stringify({ symbol, locale }),
      });
      setSelected(body.analysis);
      setHistory((current) => [body.analysis, ...current]);
    } catch (analysisError) {
      const code = analysisError instanceof Error ? analysisError.message : "INTERNAL_ERROR";
      setError(ERROR_MESSAGES[code] ?? "Não foi possível concluir a análise.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function copyAnalysis() {
    if (!selected) return;
    await navigator.clipboard.writeText(copyText(selected, locale));
    setCopied(true);
  }

  const result = selected?.result ?? null;
  const successfulHistory = useMemo(() => history.filter((item) => item.status === "SUCCESS"), [history]);

  if (unauthorized) {
    return <section className="rc-radar-auth"><p>{locale === "en" ? "AI Radar requires internal authentication." : locale === "es" ? "Radar IA requiere autenticación interna." : "O Radar IA exige autenticação interna."}</p><Link href="/login" className="rc-home-cta rc-home-cta--primary">{t("actions.enter")}</Link></section>;
  }

  return (
    <div className="rc-radar-page">
      <header className="rc-radar-hero">
        <p className="rc-section-kicker">{locale === "en" ? "ADVISORY LAYER · READ ONLY" : locale === "es" ? "CAPA CONSULTIVA · SOLO LECTURA" : "CAMADA CONSULTIVA · SOMENTE LEITURA"}</p>
        <h1>{t("radar.title")}</h1>
        <p>{locale === "en" ? "Crypto market intelligence based on historical data and current conditions." : locale === "es" ? "Análisis inteligente del mercado cripto basado en datos históricos y condiciones actuales." : "Análise inteligente do mercado cripto baseada em dados históricos e condições atuais."}</p>
        <div className="rc-radar-safety"><i aria-hidden /> Binance public market data · {locale === "en" ? "no order permission" : locale === "es" ? "sin permiso para enviar órdenes" : "sem permissão para enviar ordens"}</div>
      </header>

      <section className="rc-radar-control" aria-labelledby="radar-control-title">
        <div>
          <p className="rc-section-kicker">{locale === "en" ? "ASSET" : locale === "es" ? "ACTIVO" : "ATIVO"}</p>
          <h2 id="radar-control-title">{locale === "en" ? "Select market" : locale === "es" ? "Selecciona el mercado" : "Selecione o mercado"}</h2>
        </div>
        <div className="rc-radar-symbols" role="group" aria-label="Selecionar ativo">
          {RADAR_SYMBOLS.map((asset) => <button key={asset} type="button" className={symbol === asset ? "is-active" : ""} aria-pressed={symbol === asset} onClick={() => { setLoadingMarket(true); setError(null); setSymbol(asset); }}>{asset.replace("USDT", "")}</button>)}
        </div>
      </section>

      {error && <div className="rc-radar-alert" role="alert">{error}</div>}

      <section className="rc-radar-market" aria-busy={loadingMarket}>
        <article><span>{t("listings.currentPrice")}</span><strong>{snapshot ? number(snapshot.currentPrice, 8, locale) : "—"}</strong><small>USDT</small></article>
        <article><span>Variação 24h</span><strong className={(snapshot?.priceChange24hPct ?? 0) >= 0 ? "positive" : "negative"}>{snapshot ? `${number(snapshot.priceChange24hPct, 2)}%` : "—"}</strong><small>mercado público</small></article>
        <article><span>Regime objetivo</span><strong>{snapshot?.regime ?? (loadingMarket ? "A carregar…" : "—")}</strong><small>confiança {snapshot?.confidence ?? "—"}</small></article>
        <article><span>Faixa recente · 6h</span><strong>{snapshot ? `${number(snapshot.currentRange.low, 8)} — ${number(snapshot.currentRange.high, 8)}` : "—"}</strong><small>candles de 15 min</small></article>
      </section>

      <section className="rc-radar-action-panel">
        <div>
          <strong>{locale === "en" ? "Analysis only on demand" : locale === "es" ? "Análisis solo bajo demanda" : "Análise somente sob demanda"}</strong>
          <p>{locale === "en" ? "The statistical package is updated before each call. There is no OpenAI polling." : locale === "es" ? "El paquete estadístico se actualiza antes de cada llamada. No hay polling de OpenAI." : "O pacote estatístico é atualizado antes de cada chamada. Não há polling da OpenAI."}</p>
        </div>
        <button type="button" onClick={analyze} disabled={!aiConfigured || !snapshot || analyzing || loadingMarket}>
          {analyzing ? t("radar.generating") : t("radar.generate")}
        </button>
        {!aiConfigured && !loadingMarket && <small>Radar IA não configurado neste ambiente.</small>}
      </section>

      {result && selected && <section className="rc-radar-report" aria-labelledby="radar-result-title">
        <div className="rc-radar-report-head">
          <div><p className="rc-section-kicker">{locale === "en" ? "STRUCTURED REPORT" : locale === "es" ? "INFORME ESTRUCTURADO" : "RELATÓRIO ESTRUTURADO"}</p><h2 id="radar-result-title">{result.asset} · {result.regime}</h2><span>{t("news.confidence")} {result.confidence} · {date(selected.createdAt, locale)}</span></div>
          <button type="button" onClick={copyAnalysis}>{copied ? (locale === "en" ? "COPIED" : locale === "es" ? "COPIADO" : "COPIADO") : (locale === "en" ? "COPY ANALYSIS" : locale === "es" ? "COPIAR ANÁLISIS" : "COPIAR ANÁLISE")}</button>
        </div>
        <div className="rc-radar-report-grid">
          <article><h3>{t("radar.support")}</h3><pre>{zonesText(result.supportZones, locale)}</pre></article><article><h3>{t("radar.resistance")}</h3><pre>{zonesText(result.resistanceZones, locale)}</pre></article><article><h3>{t("radar.range")}</h3><p>{number(result.currentRange.low, 8, locale)} — {number(result.currentRange.high, 8, locale)} USDT</p></article><article><h3>{t("radar.volatility")}</h3><p>{result.volatility.summary}</p></article>
          <article><h3>Estratégia de range</h3><strong>{result.rangeSuitability}</strong></article>
          <article><h3>Estratégia de tendência</h3><strong>{result.trendSuitability}</strong></article>
        </div>
        <div className="rc-radar-reading"><h3>{t("radar.facts")}</h3><p>{result.factsSummary}</p><h3>{t("radar.reading")}</h3><p>{result.marketReading}</p><h3>{t("radar.risks")}</h3><ul>{result.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul><h3>{t("radar.observation")}</h3><p>{result.observation}</p></div>
        <footer><span>{result.disclaimer}</span><span>Modelo {selected.model} · Prompt {selected.promptVersion} · {selected.totalTokens == null ? "tokens indisponíveis" : `${selected.totalTokens} tokens`}</span></footer>
      </section>}

      <section className="rc-radar-history" aria-labelledby="radar-history-title">
        <div className="rc-section-heading"><div><p className="rc-section-kicker">{locale === "en" ? "PERSISTENCE" : locale === "es" ? "PERSISTENCIA" : "PERSISTÊNCIA"}</p><h2 id="radar-history-title">{t("radar.history")}</h2></div></div>
        {successfulHistory.length === 0 ? <div className="rc-radar-empty">{locale === "en" ? `No completed analysis for ${symbol}.` : locale === "es" ? `Ningún análisis completado para ${symbol}.` : `Nenhuma análise concluída para ${symbol}.`}</div> : <div className="rc-radar-history-list">{successfulHistory.map((analysis) => <button type="button" key={analysis.id} className={selected?.id === analysis.id ? "is-active" : ""} onClick={() => { setSelected(analysis); window.scrollTo({ top: 500, behavior: "smooth" }); }}><span><strong>{analysis.symbol}</strong><small>{date(analysis.createdAt, locale)}</small></span><span><strong>{analysis.result?.regime ?? "—"}</strong><small>{number(analysis.price, 8, locale)} USDT · {analysis.totalTokens ?? "—"} tokens</small></span></button>)}</div>}
      </section>
    </div>
  );
}
