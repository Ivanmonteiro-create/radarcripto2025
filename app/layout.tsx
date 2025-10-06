// app/layout.tsx
"use client";

import "./globals.css";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

function FloatingNav() {
  return (
    <nav
      aria-label="Atalhos"
      className="fixed right-4 top-20 z-[80] flex flex-col gap-2"
    >
      <Link href="/simulador" className="rc-btn">Simulador</Link>
      <Link href="/robos" className="rc-btn">Robôs (SIM)</Link>
      <Link href="/planos" className="rc-btn">Planos</Link>
      <Link href="/sobre" className="rc-btn">Sobre</Link>
      <Link href="/fale-com-agente" className="rc-btn">Fale com a gente</Link>
    </nav>
  );
}

function BackHomeRight() {
  return (
    <div className="fixed right-4 top-20 z-[80]">
      <Link href="/" className="rc-btn rc-btn--green">Voltar ao início</Link>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <html lang="pt-BR">
      <body className="rc-root">
        {/* Home: mostra a barra flutuante com 5 botões */}
        {isHome ? <FloatingNav /> : <BackHomeRight />}
        {children}
      </body>
    </html>
  );
}
