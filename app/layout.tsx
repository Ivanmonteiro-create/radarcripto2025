// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Footer from "../components/Footer"; // se tiver alias "@/components/Footer", pode usar

export const metadata: Metadata = {
  title: {
    default: "RadarCrypto — Simulador de Trading",
    template: "%s | RadarCrypto",
  },
  description:
    "Aprenda de verdade sem perder nada. Um simulador prático para testar estratégias sem risco.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "RadarCrypto — Simulador de Trading",
    description: "Teste estratégias sem risco.",
    url: "https://radarcrypto.space",
    siteName: "RadarCrypto",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RadarCrypto",
    description: "Simulador de Trading",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">{/* troque para pt-BR se preferir */}
      <body className="rc-root">
        {children}
        <Footer />
      </body>
    </html>
  );
}
