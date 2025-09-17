// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "RadarCrypto 2025",
  description: "Simulador e site base — RadarCrypto 2025",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif",
          background: "#0b0f14",
          color: "#e5e7eb",
        }}
      >
        <Navbar />
        <main style={{ maxWidth: 1024, margin: "32px auto", padding: "0 16px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
