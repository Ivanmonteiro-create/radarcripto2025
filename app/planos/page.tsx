// app/planos/page.tsx
"use client";
import Link from "next/link";

type Feature = { text: string; soon?: boolean; locked?: boolean };
type Plano = {
  slug: string;
  titulo: string;
  subtitulo: string;
  preco: string;
  por: string;
  destaque?: string;
  acoesLabel: string;
  recursos: Feature[];
};

const planos: Plano[] = [
  {
    slug: "starter",
    titulo: "Starter",
    subtitulo: "Grátis para começar",
    preco: "€ 0,00",
    por: "",
    destaque: "PLANO COMBO",
    acoesLabel: "Começar de graça",
    recursos: [
      { text: "Simulador Spot básico" },
      { text: "Saldo simulado: 10.000 USDT" },
      { text: "Histórico de operações" },
      { text: "Integração do preço com TradingView" },
      { text: "Robôs de estratégia", soon: true, locked: true },
      { text: "Exportar resultados (CSV)", soon: true, locked: true },
      { text: "Relatórios e gráficos avançados", soon: true, locked: true },
    ],
  },
  {
    slug: "trader",
    titulo: "Trader",
    subtitulo: "Plano inicial pago",
    preco: "€ 9,99",
    por: "/mês",
    destaque: "PREÇO PROMOCIONAL — FUNDADORES",
    acoesLabel: "Quero este plano",
    recursos: [
      { text: "Tudo do Starter" },
      { text: "Operações Spot com PnL realista" },
      { text: "Simulador de futuros (isolado)", soon: true },
      { text: "Suporte prioritário por e-mail" },
      { text: "Exportar resultados (CSV)" },
      { text: "Relatórios PDF de performance", soon: true },
    ],
  },
  {
    slug: "pro",
    titulo: "Pro",
    subtitulo: "Plano intermediário",
    preco: "€ 19,99",
    por: "/mês",
    destaque: "TURBO ACELERADOR",
    acoesLabel: "Subir para Pro",
    recursos: [
      { text: "Tudo do Trader" },
      { text: "Módulos de gerenciamento de risco" },
      { text: "Robôs: backtests e presets" },
      { text: "Automação parcial de ordem (paper)" },
      { text: "Relatórios PDF + personalização" },
      { text: "Exportar portfólios (CSV)" },
    ],
  },
  {
    slug: "elite",
    titulo: "Elite",
    subtitulo: "Plano completo",
    preco: "€ 29,99",
    por: "/mês",
    destaque: "TUDO DESBLOQUEADO",
    acoesLabel: "Virar Elite",
    recursos: [
      { text: "Tudo do Pro" },
      { text: "Módulos avançados de Robôs" },
      { text: "Workflows multi-estratégia" },
      { text: "Relatórios avançados + insights" },
      { text: "Backtests extensivos" },
      { text: "Templates premium e suporte VIP" },
    ],
  },
];

function IconOk() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,.25)",
        marginRight: 6,
        textAlign: "center",
        lineHeight: "12px",
        fontSize: 10,
        color: "#1cff80",
      }}
    >
      ✓
    </span>
  );
}
function IconLock() {
  return (
    <span
      aria-hidden
      title="Em breve"
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,.25)",
        marginRight: 6,
        textAlign: "center",
        lineHeight: "12px",
        fontSize: 10,
        color: "rgba(255,255,255,.75)",
      }}
    >
      🔒
    </span>
  );
}

export default function PlanosPage() {
  return (
    <main className="pricingPage" style={{ minHeight: "100dvh", padding: 12, display: "grid", gap: 12 }}>
      {/* Top bar com botão à DIREITA */}
      <header className="panel" style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10, padding: 12 }}>
        <div>
          <div className="pp-eyebrow">Planos</div>
        </div>
        <Link href="/" className="btn btn-primary pp-back">Voltar ao início</Link>
      </header>

      {/* Título */}
      <section className="panel" style={{ textAlign: "center", paddingBlock: 14 }}>
        <h1 className="pp-title">Escolha seu caminho no RadarCrypto</h1>
        <p className="pp-sub">
          Comece no Spot com 10.000 USDT simulados. Evolua para Gestão de Risco, Futuros e Robôs conforme o plano.
        </p>
      </section>

      {/* Cards compactados */}
      <section className="pp-grid">
        {planos.map((p) => (
          <article key={p.slug} className="panel pp-card">
            {p.destaque && <div className="pp-badge">{p.destaque}</div>}

            <div>
              <div className="pp-subtitle">{p.subtitulo}</div>
              <h2 className="pp-cardTitle">{p.titulo}</h2>
            </div>

            <div className="pp-priceRow">
              <div className="pp-price">{p.preco}</div>
              <div className="pp-per">{p.por}</div>
            </div>

            <ul className="pp-list">
              {p.recursos.map((f, i) => (
                <li key={i} className="pp-item">
                  {f.locked || f.soon ? <IconLock /> : <IconOk />}
                  <span className="pp-itemText">
                    {f.text}
                    {f.soon && <span className="pp-soon">em breve</span>}
                  </span>
                </li>
              ))}
            </ul>

            <div>
              <button className="btn btn-primary pp-cta">{p.acoesLabel}</button>
            </div>
          </article>
        ))}
      </section>

      {/* CSS compacto local */}
      <style jsx global>{`
        .pricingPage .pp-eyebrow { color: var(--muted); text-transform: uppercase; letter-spacing: .12em; font-size: 11px; }
        .pricingPage .pp-back { padding: 8px 12px; border-radius: 10px; font-size: 13px; }

        .pricingPage .pp-title { margin: 0; font-size: 24px; font-weight: 900; }
        .pricingPage .pp-sub { margin: 4px 0 0; color: var(--muted); font-size: 13px; }

        .pricingPage .pp-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(230px, 1fr)); /* ↓ menor largura mínima */
          gap: 12px;
        }
        .pricingPage .pp-card { display: grid; gap: 10px; padding: 12px; } /* ↓ padding */
        .pricingPage .pp-badge {
          align-self: start; justify-self: start;
          font-size: 11px; padding: 4px 8px; border-radius: 999px;
          border: 1px solid rgba(33,243,141,.35); background: rgba(33,243,141,.12);
          color: var(--accent-strong); font-weight: 800;
        }
        .pricingPage .pp-subtitle { color: var(--muted); font-size: 12px; }
        .pricingPage .pp-cardTitle { margin: 2px 0 0; font-size: 18px; font-weight: 900; } /* ↓ título */
        .pricingPage .pp-priceRow { display: flex; align-items: baseline; gap: 6px; }
        .pricingPage .pp-price { font-size: 22px; font-weight: 900; }  /* ↓ preço */
        .pricingPage .pp-per { color: var(--muted); font-size: 11px; }

        .pricingPage .pp-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; } /* ↓ espaçamento da lista */
        .pricingPage .pp-item { display: flex; align-items: center; }
        .pricingPage .pp-itemText { font-size: 13px; } /* ↓ texto item */
        .pricingPage .pp-soon {
          font-size: 10px; margin-left: 6px; padding: 1px 6px; border-radius: 999px;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18); color: rgba(255,255,255,.75);
        }

        .pricingPage .pp-cta { padding: 9px 12px; border-radius: 10px; font-size: 13px; } /* ↓ CTA */
      `}</style>
    </main>
  );
}
