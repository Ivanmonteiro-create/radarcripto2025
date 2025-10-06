// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const links = [
  { href: "/simulador", label: "Simulador" },
  { href: "/robos", label: "Robôs (SIM)" },
  { href: "/planos", label: "Planos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/fale-com-agente", label: "Fale com a gente" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="rc-navbar" role="navigation" aria-label="Principal">
      <div className="rc-navbar__inner">
        <Link href="/" className="rc-navbar__brand" aria-label="RadarCrypto">
          <span className="rc-logo-dot" />
          <span className="rc-brand-text">RadarCrypto</span>
          <span className="rc-brand-phase">• Fase 1</span>
        </Link>

        <nav className="rc-navbar__nav">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`rc-navlink ${active ? "is-active" : ""}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
