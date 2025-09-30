// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "RadarCrypto — Simulador de Trading",
  description:
    "Aprenda de verdade sem perder nada. Um simulador prático para testar estratégias sem risco.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "RadarCrypto — Simulador de Trading",
    description: "Teste estratégias sem risco.",
    url: "https://radarcripto.space",
    siteName: "RadarCrypto",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RadarCrypto",
    description: "Simulador de Trading",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
