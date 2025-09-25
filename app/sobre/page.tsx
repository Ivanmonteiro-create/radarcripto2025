// app/sobre/page.tsx
import Link from "next/link";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        display: "grid",
        placeItems: "center",
        background: "rgba(255,255,255,.08)",
        border: "1px solid rgba(255,255,255,.18)",
        boxShadow: "0 1px 0 rgba(255,255,255,.08) inset",
        fontSize: 20,
      }}
    >
      {children}
    </div>
  );
}

export default function SobrePage() {
  return (
    <main
      className="sobrePage"
      style={{ minHeight: "100dvh", padding: 12, display: "grid", gap: 12 }}
    >
      {/* Topo com CTA para voltar */}
      <header
        className="panel"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 10,
          padding: 12,
        }}
      >
        <div>
          <div
            style={{
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: ".12em",
              fontSize: 11,
            }}
          >
            Sobre
          </div>
        </div>
        <Link href="/" className="btn btn-primary" style={{ padding: "8px 12px", borderRadius: 10, fontWeight: 800 }}>
          Voltar ao início
        </Link>
      </header>

      {/* Herói curto e direto */}
      <section
        className="panel"
        style={{ textAlign: "center", paddingBlock: 16, paddingInline: 12 }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "-0.01em",
          }}
        >
          Sobre o RadarCrypto
        </h1>
        <p
          style={{
            margin: "6px auto 0",
            color: "var(--muted)",
            fontSize: 14,
            maxWidth: 780,
          }}
        >
          <strong>RadarCrypto</strong>: onde você erra, aprende e evolui.
          Treine no <strong>Spot</strong> ou no <strong>Futuro</strong> com
          saldo virtual e prepare-se para ganhar confiança no mercado real.
        </p>
      </section>

      {/* Três cartões ilustrativos e objetivos */}
      <section
        className="cards"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <article className="panel" style={{ display: "grid", gap: 10, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon>🧪</Icon>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Errar sem riscos</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.4 }}>
            Simulador com <strong>10.000 USDT</strong> virtuais para testar
            ideias sem colocar dinheiro real em risco.
          </p>
        </article>

        <article className="panel" style={{ display: "grid", gap: 10, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon>📈</Icon>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Aprender de verdade</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.4 }}>
            Pratique <strong>Spot</strong> e <strong>Futuro</strong> com
            métricas claras e noções de gestão de risco aplicadas ao dia a dia.
          </p>
        </article>

        <article className="panel" style={{ display: "grid", gap: 10, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon>🚀</Icon>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Evoluir sempre</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.4 }}>
            Ganhe <strong>confiança</strong> antes de operar no real. Treine,
            ajuste estratégias e veja sua evolução no histórico.
          </p>
        </article>
      </section>

      {/* Fechamento curto */}
      <section className="panel" style={{ padding: 12, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          O RadarCrypto é mais que um simulador — é a sua{" "}
          <strong>escola de trading</strong>.
        </p>
      </section>
    </main>
  );
}
