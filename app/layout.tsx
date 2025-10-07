// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "RadarCrypto — Simulador & Robôs (SIM)",
  description:
    "Aprenda trading na prática, sem arriscar um centavo. Simulador e robôs no modo SIM (dados em tempo real, sem risco).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="rc-root">
        <TopNav />
        <main className="rc-main">{children}</main>
      </body>
    </html>
  );
}
