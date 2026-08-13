"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NEWS_ASSETS, NEWS_CATEGORIES } from "@/lib/news/contracts";
import { useI18n } from "@/components/i18n/LocaleProvider";

type Source = { id: string; key: string; name: string; confidence: string; tier: number; lastFetchedAt: string | null; lastSuccessAt: string | null; lastError: string | null };
type EventSource = { item: { id: string; title: string; url: string; excerpt: string | null; publishedAt: string; source: Source } };
type Analysis = { summary: string; whyItMatters: string; affectedAssets: string[]; impact: string; sentiment: string; confidence: string; model: string; totalTokens: number | null };
type NewsEvent = { id: string; canonicalTitle: string; category: string; assets: string[]; firstPublishedAt: string; lastPublishedAt: string; sourceCount: number; sourceConfidence: string; normalizedSummary: string | null; aiStatus: string; aiErrorCode: string | null; aiAnalysis: Analysis | null; sources: EventSource[] };

type Translation = Record<string, string>;
type ApiData = { events: NewsEvent[]; sources: Source[]; refreshMinutes: number; aiConfigured: boolean; translations?: Record<string, Translation> };
type Filters = { period: "24h" | "7d" | "30d"; asset: string; impact: string; category: string };

function date(value: string, locale: string) { return new Date(value).toLocaleString(locale); }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw Object.assign(new Error(body.error ?? "INTERNAL_ERROR"), { status: response.status });
  return body as T;
}

function EventCard({ event, featured = false, translated = {} }: { event: NewsEvent; featured?: boolean; translated?: Translation }) {
  const { locale, t } = useI18n();
  const localeTag = locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-GB";
  const analysis = event.aiAnalysis;
  const aiLabel = analysis ? t("status.analyzed") : event.aiStatus === "ERROR" ? t("status.aiError") : t("status.awaitingAi");
  return <article className={`rc-news-card ${featured ? "rc-news-card--featured" : ""}`}>
    <div className="rc-news-card__meta">
      <span className={`rc-news-ai-status rc-news-ai-status--${event.aiStatus.toLowerCase()}`}>{aiLabel}</span>
      {analysis && <span className={`rc-news-impact rc-news-impact--${analysis.impact.toLowerCase()}`}>{analysis.impact}</span>}
      <span>{event.assets.join(" / ")}</span><span>{translated.category || event.category}</span><time>{date(event.lastPublishedAt, localeTag)}</time>
    </div>
    <h3>{translated.title || event.canonicalTitle}</h3>
    <div className="rc-news-confidence"><strong>{translated.sourceConfidence || event.sourceConfidence}</strong>{event.sourceConfidence === "NÃO CONFIRMADO" && <span>{locale === "en" ? "Not confirmed by a primary source." : locale === "es" ? "No confirmado por una fuente primaria." : "Não confirmado por fonte primária."}</span>}</div>
    <p>{translated.summary || analysis?.summary || event.normalizedSummary || "—"}</p>
    {analysis ? <div className="rc-news-analysis">
      <div><span>{t("news.why")}</span><p>{translated.whyItMatters || analysis.whyItMatters}</p></div><div><span>{t("news.sentiment")}</span><strong>{translated.sentiment || analysis.sentiment}</strong></div><div><span>{t("news.confidence")}</span><strong>{translated.confidence || analysis.confidence}</strong></div>
    </div> : <div className="rc-news-ai-missing">{locale === "en" ? "Normalized content available. AI summary has not been processed yet." : locale === "es" ? "Contenido normalizado disponible. El resumen IA aún no se ha procesado." : "Conteúdo normalizado disponível. Resumo IA ainda não processado."}</div>}
    <footer><span>{event.sourceCount} {locale === "en" ? "related source(s)" : locale === "es" ? "fuente(s) relacionada(s)" : "fonte(s) relacionada(s)"}</span><div>{event.sources.map(({ item }) => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">{item.source.name} ↗</a>)}</div></footer>
  </article>;
}

export default function NewsRadarClient() {
  const { locale, t } = useI18n();
  const [filters, setFilters] = useState<Filters>({ period: "24h", asset: "", impact: "", category: "" });
  const [data, setData] = useState<ApiData>({ events: [], sources: [], refreshMinutes: 30, aiConfigured: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (current: Filters) => {
    const params = new URLSearchParams({ period: current.period, locale });
    if (current.asset) params.set("asset", current.asset);
    if (current.impact) params.set("impact", current.impact);
    if (current.category) params.set("category", current.category);
    try {
      const next = await api<ApiData>(`/api/noticias/events?${params}`);
      setData(next); setUnauthorized(false);
    } catch (error) {
      if (typeof error === "object" && error && "status" in error && error.status === 401) setUnauthorized(true);
      setMessage("Não foi possível carregar os eventos.");
    } finally { setLoading(false); }
  }, [locale]);

  useEffect(() => { const timer = window.setTimeout(() => void load(filters), 0); return () => window.clearTimeout(timer); }, [filters, load]);

  function update<K extends keyof Filters>(key: K, value: Filters[K]) { setLoading(true); setMessage(null); setFilters((current) => ({ ...current, [key]: value })); }

  async function refresh() {
    setRefreshing(true); setMessage(null);
    try {
      const result = await api<{ collection: { inserted: number; sources: Array<{ ok: boolean }> } }>("/api/noticias/refresh", {
        method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ analyzeWithAi: false }),
      });
      const healthy = result.collection.sources.filter((source) => source.ok).length;
      setMessage(`${result.collection.inserted} item(ns) novo(s) e ${healthy} fonte(s) disponíveis. Nenhuma análise IA foi solicitada.`);
      await load(filters);
    } catch (error) {
      const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
      setMessage(code === "NEWS_REFRESH_RATE_LIMITED" ? `Atualização disponível a cada ${data.refreshMinutes} minutos.` : "A atualização encontrou um erro; o histórico existente permanece disponível.");
    } finally { setRefreshing(false); }
  }

  async function analyze() {
    setAnalyzing(true); setMessage(null);
    try {
      const result = await api<{ ai: { configured: boolean; analyzed: number; calls: number; usage: { totalTokens: number | null } | null; model?: string; error?: string } }>("/api/noticias/analyze", {
        method: "POST", headers: { "x-radarcrypto-csrf": "1" },
      });
      if (!result.ai.configured) {
        setMessage("OpenAI não está configurada neste ambiente; as notícias permanecem disponíveis.");
      } else if (result.ai.error) {
        setMessage(`A análise IA falhou (${result.ai.error}); os eventos poderão ser processados novamente.`);
      } else {
        const tokens = result.ai.usage?.totalTokens ?? 0;
        const model = result.ai.model ?? "não utilizado";
        setMessage(`${result.ai.analyzed} evento(s) processado(s), ${result.ai.calls} chamada(s), ${tokens} token(s), modelo ${model}.`);
      }
      await load(filters);
    } catch {
      setMessage("A análise IA encontrou um erro; as notícias permanecem disponíveis.");
    } finally { setAnalyzing(false); }
  }

  async function translateMissing() {
    if (data.events.length === 0) return;
    setAnalyzing(true); setMessage(null);
    try {
      const result = await api<{ generated: number }>("/api/translations/ensure", {
        method: "POST",
        headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" },
        body: JSON.stringify({ entityType: "NEWS_EVENT", ids: data.events.slice(0, 20).map((event) => event.id), locale }),
      });
      setMessage(locale === "en" ? `${result.generated} missing translation(s) generated and cached.` : locale === "es" ? `${result.generated} traducción(es) faltante(s) generada(s) y guardada(s).` : `${result.generated} tradução(ões) ausente(s) gerada(s) e armazenada(s).`);
      await load(filters);
    } catch {
      setMessage(locale === "en" ? "Translations could not be generated; original content remains available." : locale === "es" ? "No se pudieron generar las traducciones; el contenido original sigue disponible." : "Não foi possível gerar as traduções; o conteúdo original continua disponível.");
    } finally { setAnalyzing(false); }
  }

  const highImpact = useMemo(() => data.events.filter((event) => event.aiAnalysis && ["ALTO", "CRÍTICO"].includes(event.aiAnalysis.impact)).slice(0, 3), [data.events]);

  if (unauthorized) return <section className="rc-radar-auth"><p>{locale === "en" ? "News & Events requires internal authentication." : locale === "es" ? "Noticias y Eventos requiere autenticación interna." : "Notícias e Eventos exige autenticação interna."}</p><Link href="/login" className="rc-home-cta rc-home-cta--primary">{t("actions.enter")}</Link></section>;

  return <div className="rc-news-page">
    <header className="rc-news-hero"><p className="rc-section-kicker">RSS · {locale === "en" ? "CONSOLIDATED EVENTS" : locale === "es" ? "EVENTOS CONSOLIDADOS" : "EVENTOS CONSOLIDADOS"}</p><h1>{t("news.title")}</h1><p>{t("news.description")}</p><div><i /> RSS · {locale === "en" ? "public feeds · no trade execution" : locale === "es" ? "feeds públicos · sin ejecución de trading" : "feeds públicos · nenhuma execução de trading"}</div></header>

    <section className="rc-news-toolbar">
      <div className="rc-news-filter"><span>{t("news.period")}</span>{(["24h", "7d", "30d"] as const).map((period) => <button key={period} className={filters.period === period ? "is-active" : ""} onClick={() => update("period", period)}>{period}</button>)}</div>
      <div className="rc-news-filter"><span>{t("news.asset")}</span><button className={!filters.asset ? "is-active" : ""} onClick={() => update("asset", "")}>{t("common.allF")}</button>{NEWS_ASSETS.map((asset) => <button key={asset} className={filters.asset === asset ? "is-active" : ""} onClick={() => update("asset", asset)}>{asset === "MERCADO" ? (locale === "en" ? "Market" : locale === "es" ? "Mercado" : "Mercado") : asset}</button>)}</div>
      <label>{t("news.impact")}<select value={filters.impact} onChange={(event) => update("impact", event.target.value)}><option value="">{t("common.all")}</option><option value="ALTO">{locale === "en" ? "High" : locale === "es" ? "Alto" : "Alto"}</option><option value="MÉDIO">{locale === "en" ? "Medium" : locale === "es" ? "Medio" : "Médio"}</option><option value="BAIXO">{locale === "en" ? "Low" : locale === "es" ? "Bajo" : "Baixo"}</option><option value="CRÍTICO">{locale === "en" ? "Critical" : locale === "es" ? "Crítico" : "Crítico"}</option></select></label>
      <label>{t("news.category")}<select value={filters.category} onChange={(event) => update("category", event.target.value)}><option value="">{t("common.allF")}</option>{NEWS_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      <div className="rc-news-actions">
        <button className="rc-news-refresh" onClick={refresh} disabled={refreshing || analyzing}>{refreshing ? t("news.refreshing") : t("news.refresh")}</button>
        <div><button className="rc-news-analyze" onClick={analyze} disabled={refreshing || analyzing || !data.aiConfigured}>{analyzing ? t("news.analyzing") : t("news.analyze")}</button><small>{t("news.aiCost")}</small></div>
        <button className="rc-news-refresh" onClick={translateMissing} disabled={refreshing || analyzing || data.events.length === 0}>{locale === "en" ? "TRANSLATE MISSING" : locale === "es" ? "TRADUCIR PENDIENTES" : "TRADUZIR PENDENTES"}</button>
      </div>
    </section>
    {message && <div className="rc-radar-alert" role="status">{message}</div>}

    <section className="rc-news-high" aria-labelledby="high-impact-title"><div className="rc-section-heading"><div><p className="rc-section-kicker">{locale === "en" ? "CONTROLLED HIGHLIGHT" : locale === "es" ? "DESTAQUE CONTROLADO" : "DESTAQUE CONTROLADO"}</p><h2 id="high-impact-title">{t("news.high")}</h2></div><p>{locale === "en" ? "Potential impact is not a price forecast." : locale === "es" ? "El impacto potencial no equivale a una predicción de precio." : "Impacto potencial não equivale a previsão de preço."}</p></div>{highImpact.length ? <div className="rc-news-grid">{highImpact.map((event) => <EventCard key={event.id} event={event} featured translated={data.translations?.[event.id]} />)}</div> : <div className="rc-radar-empty">{locale === "en" ? "No high-impact event in this filter." : locale === "es" ? "Ningún evento de alto impacto en este filtro." : "Nenhum evento classificado como alto impacto neste filtro."}</div>}</section>

    <section className="rc-news-list" aria-labelledby="news-history-title"><div className="rc-section-heading"><div><p className="rc-section-kicker">{locale === "en" ? "HISTORY" : locale === "es" ? "HISTORIAL" : "HISTÓRICO"} · {filters.period}</p><h2 id="news-history-title">{t("news.consolidated")}</h2></div><p>{loading ? t("actions.loading") : `${data.events.length} evento(s) · ${data.refreshMinutes} min.`}</p></div>{data.events.length ? <div className="rc-news-grid">{data.events.map((event) => <EventCard key={event.id} event={event} translated={data.translations?.[event.id]} />)}</div> : !loading && <div className="rc-radar-empty">{locale === "en" ? "No events found. Refresh sources to start controlled collection." : locale === "es" ? "No se encontraron eventos. Actualiza las fuentes para iniciar la recopilación." : "Nenhum evento encontrado. Use “Atualizar fontes” para iniciar a coleta controlada."}</div>}</section>

    <section className="rc-news-sources"><div><p className="rc-section-kicker">{locale === "en" ? "TRANSPARENCY" : locale === "es" ? "TRANSPARENCIA" : "TRANSPARÊNCIA"}</p><h2>{t("news.sources")}</h2></div><div>{data.sources.map((source) => <article key={source.id}><span className={source.lastError ? "is-error" : "is-ok"} /><strong>{source.name}</strong><small>{source.confidence}</small><small>{source.lastError ? `${t("common.unavailable")}: ${source.lastError}` : source.lastSuccessAt ? `${date(source.lastSuccessAt, locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-GB")}` : t("common.notProvided")}</small></article>)}</div>{!data.aiConfigured && <p>OpenAI: {t("common.unavailable")}</p>}</section>
  </div>;
}
