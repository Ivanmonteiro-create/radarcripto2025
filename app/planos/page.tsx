// app/planos/page.tsx
import Link from "next/link";

type Feature = {
  text: string;
  soon?: boolean;     // mostra "em breve"
  locked?: boolean;   // mostra cadeado
};

type Plano = {
  slug: string;
  titulo: string;
  subtitulo: string;
  preco: string;
  por: string;        // /mês, /ano, etc.
  destaque?: string;  // badge (ex: "MAIS POPULAR")
  acoesLabel: string; // texto do botão principal
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
        width: 16,
        height: 16,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,.25)",
        marginRight: 8,
        textAlign: "center",
        lineHeight: "14px",
        fontSize: 12,
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
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,.25)",
        marginRight: 8,
        textAlign: "center",
        lineHeight: "14px",
        fontSize: 12,
        color: "rgba(255,255,255,.75)",
      }}
      title="Em breve"
    >
      🔒
    </span>
  );
}

export default function PlanosPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: 16,
        display: "grid",
        gap: 16,
      }}
    >
      {/* Barra superior: título + botão Voltar ao início (à direita) */}
      <header
        className="panel"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: ".12em",
              fontSize: 12,
            }}
          >
            Planos
          </div>
        </div>

        <Link href="/" className="btn btn-primary" style={{ padding: "10px 14px", borderRadius: 10 }}>
          Voltar ao início
        </Link>
      </header>

      {/* Título da seção */}
      <section
        className="panel"
        style={{
          textAlign: "center",
          paddingBlock: 18,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>
          Escolha seu caminho no RadarCrypto
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
          Comece no Spot com 10.000 USDT simulados. Evolua para Gestão de Risco, Futuros e Robôs conforme o plano.
        </p>
      </section>

      {/* Cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {planos.map((p) => (
          <article key={p.slug} className="panel" style={{ display: "grid", gap: 12 }}>
            {/* badge opcional */}
            {p.destaque && (
              <div
                style={{
                  alignSelf: "start",
                  justifySelf: "start",
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(33,243,141,.35)",
                  background: "rgba(33,243,141,.12)",
                  color: "var(--accent-strong)",
                  fontWeight: 800,
                }}
              >
                {p.destaque}
              </div>
            )}

            <div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{p.subtitulo}</div>
              <h2 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 900 }}>{p.titulo}</h2>
            </div>

            {/* preço */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginTop: 2,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900 }}>{p.preco}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{p.por}</div>
            </div>

            {/* lista de recursos */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {p.recursos.map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center" }}>
                  {f.locked || f.soon ? <IconLock /> : <IconOk />}
                  <span style={{ fontSize: 14 }}>
                    {f.text}{" "}
                    {f.soon && (
                      <span
                        style={{
                          fontSize: 11,
                          marginLeft: 6,
                          padding: "2px 6px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,.08)",
                          border: "1px solid rgba(255,255,255,.18)",
                          color: "rgba(255,255,255,.75)",
                        }}
                      >
                        em breve
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {/* ações */}
            <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" style={{ padding: "12px 14px", borderRadius: 12 }}>
                {p.acoesLabel}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
