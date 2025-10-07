// components/TopNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const LINKS = [
  { href: "/simulador", label: "Simulador" },
  { href: "/robos", label: "Robôs (SIM)" },
  { href: "/planos", label: "Planos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/fale-com-agente", label: "Fale com a gente" },
];

export default function TopNav() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <>
      {onHome ? (
        <nav className="rc-topnav" aria-label="Navegação principal">
          <div className="rc-topnav__inner">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} className={`rc-pill ${active ? "is-active" : ""}`}>
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : (
        <div className="rc-backtop">
          <Link href="/" className="rc-btn rc-btn--green">Voltar ao início</Link>
        </div>
      )}
    </>
  );
}
