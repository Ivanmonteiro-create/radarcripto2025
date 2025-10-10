// app/robos/layout.tsx
import React from "react";

export const metadata = {
  title: "Robôs (SIM) — RadarCrypto",
};

export default function RobosLayout({ children }: { children: React.ReactNode }) {
  // Só envolve a página Robôs com uma âncora de CSS
  return <main className="page-robos">{children}</main>;
}
