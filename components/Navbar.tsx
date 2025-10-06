// components/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const links = [
  { href: "/", label: "Início" },
  { href: "/simulador", label: "Simulador" },
  { href: "/robos", label: "Robôs (SIM)" }, // ← destaque pedido
  { href: "/planos", label: "Planos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/fale-com-agente", label: "Fale com a gente" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[70] backdrop-blur-sm"
      aria-label="Barra de navegação"
    >
      <div className="mx-auto w-[min(1100px,96%)] flex items-center justify-between py-2">
        {/* Logo / nome curto */}
        <Link href="/" className="font-extrabold tracking-tight">
          RadarCrypto
          <span className="opacity-60 font-semibold"> · Fase 1</span>
        </Link>

        {/* Links desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => {
            const active = pathname === l.href;
            const base =
              "rc-btn !py-2 !px-3 !rounded-xl !text-sm border";
            const green =
              "rc-btn--green border-[rgba(33,243,141,.35)]";
            const ghost =
              "hover:opacity-100 opacity-90";

            const cls =
              l.label.includes("Robôs")
                ? `${base} ${green}`
                : `${base} ${ghost} bg-[rgba(255,255,255,.06)]`;

            return (
              <Link key={l.href} href={l.href} className={cls} aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
