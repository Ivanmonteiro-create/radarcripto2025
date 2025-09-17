// app/page.tsx
export default function Home() {
  return (
    <section
      style={{
        display: "grid",
        gap: 16,
        alignItems: "center",
        justifyItems: "center",
        minHeight: "55vh",
        textAlign: "center",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          border: "1px solid rgba(34,197,94,0.35)",
          color: "#22c55e",
          borderRadius: 999,
          fontSize: 12,
          letterSpacing: 0.3,
        }}
      >
        ✅ Deploy OK — Checkpoint #1
      </div>

      <h1 style={{ fontSize: 36, margin: 0, lineHeight: 1.2 }}>
        Bem-vindo ao <span style={{ color: "#22d3ee" }}>RadarCrypto 2025</span>
      </h1>

      <p style={{ maxWidth: 680, color: "#94a3b8" }}>
        Este é o esqueleto inicial. A partir daqui vamos construir o simulador,
        blocos de página e integrações — sempre com checkpoints.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <a
          href="/simulador"
          style={{
            textDecoration: "none",
            background: "#22c55e",
            color: "#0b0f14",
            padding: "10px 14px",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Acessar simulador
        </a>
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          style={{
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#e5e7eb",
            padding: "10px 14px",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Ver repositório
        </a>
      </div>
    </section>
  );
}
