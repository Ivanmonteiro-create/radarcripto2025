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
    <header className="rc-topbar">
      <div className="rc-topbar__inner">
        {onHome ? (
          <nav className="rc-pills" aria-label="Navegação principal">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rc-pill rc-pill--green">
                {l.label}
              </Link>
            ))}
          </nav>
        ) : (
          <div className="rc-backtop">
            <Link href="/" className="rc-btn rc-btn--green">Voltar ao início</Link>
          </div>
        )}
      </div>
    </header>
  );
}
