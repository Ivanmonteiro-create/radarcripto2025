"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Início" },
    { href: "/acessar-simulador", label: "Acessar simulador" },
    { href: "/planos", label: "Planos" },
    { href: "/sobre", label: "Sobre" },
    { href: "/robos", label: "Robôs" },
    { href: "/fale-com-agente", label: "Fale com a gente" },
  ];

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-2 sm:gap-4 py-4">
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 rounded-md border transition-all ${
              active
                ? "bg-green-500 text-black border-green-500"
                : "border-green-500 text-green-400 hover:bg-green-500/20"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
