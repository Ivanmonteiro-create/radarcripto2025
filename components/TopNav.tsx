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
  const onHome = pathname === "/";

  return (
    <nav className="rc-topnav" aria-label="Navegação principal">
      <div className="rc-topnav__inner">
        {onHome ? (
          LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rc-pill">
              {l.label}
            </Link>
          ))
        ) : (
          <div className="rc-backtop">
            <Link href="/" className="rc-btn rc-btn--green">Voltar ao início</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
