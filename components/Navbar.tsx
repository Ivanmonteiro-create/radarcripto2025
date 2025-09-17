// components/Navbar.tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(12, 16, 22, 0.85)",
        backdropFilter: "blur(6px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <nav
        style={{
          maxWidth: 1024,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", color: "#22d3ee", fontWeight: 700 }}>
          RadarCrypto 2025
        </Link>

        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/" style={{ textDecoration: "none", color: "#e5e7eb" }}>
            Início
          </Link>
          <Link href="/simulador" style={{ textDecoration: "none", color: "#e5e7eb" }}>
            Acessar simulador
          </Link>
          <a
            href="mailto:contato@radarcripto.space"
            style={{ textDecoration: "none", color: "#e5e7eb" }}
          >
            Fale com a gente
          </a>
        </div>
      </nav>
    </header>
  );
}
