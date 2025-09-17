// components/Navbar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/planos", label: "Planos" },
  { href: "/acessar-simulador", label: "Acessar simulador" },
  { href: "/fale-com-agente", label: "Fale com a gente" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <aside className="panel rightMenu">
      <nav className="menuList">
        {itens.map((i) => (
          <Link key={i.href} href={i.href} className={`menuBtn ${pathname === i.href ? "active" : ""}`}>
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
