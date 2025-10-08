// app/simulador/page.tsx
import React from "react";
import SimPageClient from "./SimPageClient";

export const metadata = {
  title: "Simulador — RadarCrypto",
  description: "Simule operações com saldo virtual e aprenda sem arriscar.",
};

export default function Page() {
  return <SimPageClient />;
