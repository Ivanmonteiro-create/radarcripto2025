// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "RadarCrypto — Fundação Experimental SIM & Testnet",
  description:
    "Projeto experimental com simulador Spot e fundação para Binance Spot Testnet. Sem operação Live.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="rc-root">
        {/* TopNav sempre presente e independente de faixas */}
        <TopNav />
        <main className="rc-main">{children}</main>
      </body>
    </html>
  );
}
