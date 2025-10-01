import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RadarCrypto.space — Simulador de Trade Educacional",
    template: "%s | RadarCrypto.space"
  },
  description:
    "RadarCrypto é um simulador educacional de trade em criptomoedas. Pratique estratégias, aprenda sem risco e evolua no mercado com saldo fictício.",
  openGraph: {
    type: "website",
    url: "https://radarcrypto.space",
    title: "RadarCrypto.space — Simulador de Trade Educacional",
    description:
      "Pratique estratégias e aprenda a negociar criptomoedas com saldo fictício de 10.000 USDT. Sem riscos, só aprendizado.",
    siteName: "RadarCrypto.space",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "RadarCrypto Simulador de Trade" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "RadarCrypto.space — Simulador de Trade Educacional",
    description:
      "Pratique estratégias e aprenda a negociar criptomoedas com saldo fictício de 10.000 USDT. Sem riscos, só aprendizado.",
    images: ["/og-image.png"]
  },
  icons: { icon: "/favicon.ico" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
