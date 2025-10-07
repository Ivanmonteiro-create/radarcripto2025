// components/TopNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/simulador", label: "Simulador" },
  { href: "/robos", label: "Robôs (SIM)" },
  { href: "/planos", label: "Planos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/fale-com-agente", label: "Fale com a gente" },
];

export default function TopNav() {
  const pathname = usePathname();
  const active = (href: string) => pathname.startsWith(href);

  return (
    <nav className="rc-topnav" aria-label="Navegação principal">
      <div className="rc-topnav__inner">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`rc-pill ${active(l.href) ? "is-active" : ""}`}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
