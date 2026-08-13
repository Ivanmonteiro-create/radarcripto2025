"use client";
import Link from "next/link";
import HeroRadar from "@/components/HeroRadar";
import LiveTickers from "@/components/LiveTickers";
import MarketOverview from "@/components/MarketOverview";
import { useI18n } from "@/components/i18n/LocaleProvider";

const modules = [
  {
    id: "mercado",
    number: "01",
    title: "Mercado",
    description: "Visão geral das principais criptomoedas e condições atuais de mercado.",
    status: "ATIVO",
    statusTone: "active",
    href: "#visao-mercado",
  },
  {
    id: "robos",
    number: "02",
    title: "Robôs",
    description: "Automatize estratégias de compra e venda 24 horas por dia.",
    status: "ATIVO",
    statusTone: "active",
    href: "/robos",
  },
  {
    id: "radar-ia",
    number: "03",
    title: "Radar IA",
    description: "Análise inteligente de mercado, suportes, resistências, tendências e oportunidades.",
    status: "ATIVO",
    statusTone: "active",
    href: "/radar-ia",
  },
  {
    id: "noticias",
    number: "04",
    title: "Notícias",
    description: "Eventos e informações relevantes que podem impactar o mercado cripto.",
    status: "ATIVO",
    statusTone: "active",
    href: "/noticias",
  },
  {
    id: "listagens",
    number: "05",
    title: "Listagens",
    description: "Novas moedas, listagens, delistagens e oportunidades entre exchanges.",
    status: "ATIVO",
    statusTone: "active",
    href: "/listagens",
  },
  {
    id: "estrategias",
    number: "06",
    title: "Estratégias",
    description: "Crie, teste, acompanhe e compare diferentes estratégias.",
    status: "EM DESENVOLVIMENTO",
    statusTone: "building",
    href: undefined,
  },
] as const;

export default function HomePage() {
  const { locale, t } = useI18n();
  const l = (pt: string, en: string, es: string) => locale === "en" ? en : locale === "es" ? es : pt;
  const moduleTranslations = [
    { title: t("navigation.market"), description: t("home.marketView") },
    { title: t("navigation.robots"), description: t("home.automation") },
    { title: t("navigation.ai"), description: t("radar.title") },
    { title: t("navigation.news"), description: t("news.description") },
    { title: t("navigation.listings"), description: t("listings.description") },
    { title: t("navigation.strategies"), description: t("actions.prepared") },
  ];
  return (
    <div className="rc-home" data-page="home">
      <aside className="rc-tickers--leftColumn" aria-label={l("Cotações rápidas do mercado", "Quick market prices", "Cotizaciones rápidas del mercado")}>
        <LiveTickers />
      </aside>

      <HeroRadar />

      <section className="rc-hero" aria-labelledby="home-title">
        <div className="rc-hero_inner">
          <p className="rc-hero_eyebrow">{t("home.eyebrow")}</p>
          <h1 id="home-title" className="rc-hero_title">
            {t("home.title")}
          </h1>
          <p className="rc-hero_desc">
            {t("home.description")}
          </p>
          <div className="rc-hero_actions">
            <Link href="#visao-mercado" className="rc-home-cta rc-home-cta--primary">
              {t("home.explore")}
            </Link>
            <Link href="/robos" className="rc-home-cta rc-home-cta--secondary">
              {t("home.viewBots")}
            </Link>
          </div>
          <p className="rc-hero_note">
            {t("home.note")}
          </p>
        </div>
      </section>

      <div className="rc-home-content">
        <section className="rc-home-section" aria-labelledby="platform-title">
          <div className="rc-section-heading">
            <div>
              <p className="rc-section-kicker">{t("home.platform")}</p>
              <h2 id="platform-title">{t("home.platformTitle")}</h2>
            </div>
            <p>
              {t("home.platformDescription")}
            </p>
          </div>

          <div className="rc-module-grid">
            {modules.map((module, index) => {
              const content = (
                <>
                  <div className="rc-module-meta">
                    <span>{module.number}</span>
                    <span className={`rc-status rc-status--${module.statusTone}`}>{module.statusTone === "active" ? t("status.active") : t("status.development")}</span>
                  </div>
                  <h3>{moduleTranslations[index].title}</h3>
                  <p>{moduleTranslations[index].description}</p>
                  <span className="rc-module-action">
                    {module.href ? t("actions.open") : t("actions.prepared")} <span aria-hidden>↗</span>
                  </span>
                </>
              );

              return module.href ? (
                <Link id={module.id} key={module.id} href={module.href} className="rc-module-card">
                  {content}
                </Link>
              ) : (
                <article id={module.id} key={module.id} className="rc-module-card rc-module-card--pending">
                  {content}
                </article>
              );
            })}
          </div>
        </section>

        <section className="rc-automation" aria-labelledby="automation-title">
          <div className="rc-automation-copy">
            <p className="rc-section-kicker">{l("ROBÔS · PILAR PRINCIPAL", "BOTS · CORE PILLAR", "ROBOTS · PILAR PRINCIPAL")}</p>
            <h2 id="automation-title">{t("home.automation")}</h2>
            <p>
              {l("Defina suas regras e deixe o sistema executar sua estratégia continuamente, mesmo quando você não estiver acompanhando o mercado.", "Define your rules and let the system execute your strategy continuously, even when you are away from the market.", "Define tus reglas y deja que el sistema ejecute tu estrategia continuamente, incluso cuando no estés siguiendo el mercado.")}
            </p>
            <Link href="/robos" className="rc-home-cta rc-home-cta--primary">
              {t("home.manageBots")}
            </Link>
          </div>
          <div className="rc-automation-visual" aria-label={l("Recursos atuais da automação", "Current automation features", "Funciones actuales de automatización")}>
            <div><span>01</span><strong>{l("Worker persistente", "Persistent worker", "Worker persistente")}</strong><small>{l("Execução independente do navegador", "Browser-independent execution", "Ejecución independiente del navegador")}</small></div>
            <div><span>02</span><strong>{l("Controles de risco", "Risk controls", "Controles de riesgo")}</strong><small>Locks · limits · kill switch</small></div>
            <div><span>03</span><strong>{l("Histórico de testes", "Test history", "Historial de pruebas")}</strong><small>{l("Métricas e resultados persistentes", "Persistent metrics and results", "Métricas y resultados persistentes")}</small></div>
          </div>
        </section>

        <section id="visao-mercado" className="rc-home-section" aria-labelledby="market-title">
          <div className="rc-section-heading">
            <div>
              <p className="rc-section-kicker">{l("DADOS EXISTENTES", "AVAILABLE DATA", "DATOS DISPONIBLES")}</p>
              <h2 id="market-title">{t("home.marketView")}</h2>
            </div>
            <p>
              {l("Consulta rápida de preços Spot Testnet. Sem sinais inventados, recomendação de compra ou promessa de resultado.", "Quick Spot Testnet price lookup. No invented signals, buy recommendation or promised result.", "Consulta rápida de precios Spot Testnet. Sin señales inventadas, recomendación de compra ni promesa de resultados.")}
            </p>
          </div>
          <MarketOverview />
        </section>

        <section className="rc-simulator-strip" aria-labelledby="simulator-title">
          <div>
            <span className="rc-status rc-status--active">{t("status.active")}</span>
            <p className="rc-section-kicker">{l("FERRAMENTA DA PLATAFORMA", "PLATFORM TOOL", "HERRAMIENTA DE LA PLATAFORMA")}</p>
            <h2 id="simulator-title">{l("Simulador de Trading", "Trading Simulator", "Simulador de Trading")}</h2>
            <p>{l("Teste estratégias sem utilizar capital real.", "Test strategies without using real capital.", "Prueba estrategias sin utilizar capital real.")}</p>
          </div>
          <Link href="/simulador" className="rc-home-cta rc-home-cta--secondary">
            {t("home.openSimulator")}
          </Link>
        </section>

        <footer className="rc-home-footer">
          <div>
            <strong>RADARCRYPTO</strong>
            <span>{t("home.title")}</span>
          </div>
          <nav aria-label={l("Navegação institucional", "Institutional navigation", "Navegación institucional")}>
            <Link href="/planos">{t("navigation.plans")}</Link><Link href="/sobre">{t("navigation.about")}</Link><Link href="/fale-com-agente">{t("navigation.contact")}</Link><Link href="/simulador">{t("navigation.simulator")}</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
