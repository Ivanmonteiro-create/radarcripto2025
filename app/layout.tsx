// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "RadarCrypto — Simulador de Trading",
  description:
    "Aprenda trading na prática, sem arriscar um centavo. Simulador com saldo virtual e robôs em modo SIM.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="rc-root">
        <NavBar />
        {/* espaço para a barra fixa (altura ~56px) */}
        <main className="pt-[64px]">{children}</main>
      </body>
    </html>
  );
}
