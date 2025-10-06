// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
  title: "RadarCrypto — Simulador & Robôs (SIM)",
  description:
    "Aprenda trading na prática, sem arriscar um centavo. Simulador e robôs no modo SIM (dados em tempo real, sem risco).",
};

const LINKS = [
  { href: "/simulador", label: "Simulador" },
  { href: "/robos", label: "Robôs (SIM)" },
  { href: "/planos", label: "Planos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/fale-com-agente", label: "Fale com a gente" },
];

function TopNav() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <>
      {/* barra fixa e centralizada */}
      <nav className="rc-topnav" aria-label="Navegação principal">
        <div className="rc-topnav__inner">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rc-pill ${active ? "is-active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* botão único “Voltar ao início” nas páginas internas */}
      {!onHome && (
        <div className="rc-backtop">
          <Link href="/" className="rc-btn rc-btn--green">
            Voltar ao início
          </Link>
        </div>
      )}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="rc-root">
        <TopNav />
        <main className="rc-main">{children}</main>
      </body>
    </html>
  );
}
