// app/sobre/page.tsx
import Link from "next/link";

function ChipIcon({ children, hue = 140 }: { children: React.ReactNode; hue?: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        display: "grid",
        placeItems: "center",
        background: `linear-gradient(180deg, hsla(${hue},70%,42%,.22), hsla(${hue},70%,28%,.12))`,
        border: `1px solid hsla(${hue},70%,52%,.35)`,
        boxShadow: `0 0 0 2px hsla(${hue},70%,42%,.10) inset, 0 10px 30px hsla(${hue},70%,24%,.25)`,
        fontSize: 20,
        color: "var(--accent-strong)",
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
      style={{
        minHeight: "100dvh",
        position: "relative",
        padding: 16,
        display: "grid",
        gap: 14,
      }}
    >
      {/* Fundo chamativo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(1200px 600px at 15% -10%, rgba(33,243,141,.10), transparent 55%),
                       radial-gradient(800px 600px at 100% 120%, rgba(33,243,141,.10), transparent 60%)`,
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,.9), rgba(0,0,0,.7) 40%, rgba(0,0,0,.9))",
          zIndex: 0,
        }}
      />

      {/* Cabeçalho */}
      <header
        className="panel"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 10,
          padding: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 16, // aumentado
            fontWeight: 900,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            color: "var(--accent-strong)",
            textShadow: "0 0 6px rgba(33,243,141,0.6), 0 0 12px rgba(33,243,141,0.35)",
          }}
        >
          SOBRE
        </div>

        <Link
          href="/"
          className="btn btn-primary"
          style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 800 }}
        >
          Voltar ao início
        </Link>
      </header>

      {/* Hero */}
      <section
        className="panel"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "22px 16px",
          textAlign: "center",
          zIndex: 1,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            insetInline: "15%",
            top: -80,
            height: 200,
            borderRadius: 999,
            background:
              "radial-gradient(closest-side, rgba(33,243,141,.22), rgba(33,243,141,0))",
            filter: "blur(24px)",
          }}
        />
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
          }}
        >
          Sobre o <span style={{ color: "var(--accent-strong)" }}>Radacrypto</span>
        </h1>
        <p
          style={{
            margin: "8px auto 0",
            color: "var(--muted)",
            fontSize: 16,
            maxWidth: 860,
            lineHeight: 1.45,
          }}
        >
          <strong>Radacrypto</strong>: onde você erra, aprende e evolui. Treine no{" "}
          <strong>Spot</strong> ou no <strong>Futuro</strong> com saldo virtual e
          prepare-se para ganhar confiança no mercado real.
        </p>
      </section>

      {/* Cartões */}
      <section
        className="cards"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
          gap: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        <article
          className="panel"
          style={{
            display: "grid",
            gap: 12,
            padding: 14,
            borderColor: "rgba(33,243,141,.28)",
            boxShadow: "0 0 0 1px rgba(33,243,141,.10) inset",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ChipIcon hue={140}>🧪</ChipIcon>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Errar sem riscos</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>
            Simulador com <strong>10.000 USDT</strong> virtuais para testar ideias sem
            arriscar dinheiro real.
          </p>
        </article>

        <article
          className="panel"
          style={{
            display: "grid",
            gap: 12,
            padding: 14,
            borderColor: "rgba(33,243,141,.28)",
            boxShadow: "0 0 0 1px rgba(33,243,141,.10) inset",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ChipIcon hue={150}>📈</ChipIcon>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Aprender de verdade</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>
            Pratique <strong>Spot</strong> e <strong>Futuro</strong> com noções de risco
            aplicadas ao dia a dia e métricas claras.
          </p>
        </article>

        <article
          className="panel"
          style={{
            display: "grid",
            gap: 12,
            padding: 14,
            borderColor: "rgba(33,243,141,.28)",
            boxShadow: "0 0 0 1px rgba(33,243,141,.10) inset",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ChipIcon hue={160}>🚀</ChipIcon>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Evoluir sempre</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>
            Ganhe <strong>confiança</strong> antes de operar no real. Ajuste estratégias
            e acompanhe sua evolução no histórico.
          </p>
        </article>
      </section>

      {/* Fechamento */}
      <section className="panel" style={{ padding: 14, textAlign: "center", zIndex: 1 }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          O Radacrypto é mais que um simulador — é a sua{" "}
          <strong>escola de trading</strong>.
        </p>
      </section>
    </main>
  );
}
