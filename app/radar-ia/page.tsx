import type { Metadata } from "next";
import RadarAiClient from "@/components/radar-ai/RadarAiClient";

export const metadata: Metadata = {
  title: "Radar IA — RadarCrypto",
  description: "Análise consultiva de mercado baseada em dados objetivos da Binance Spot Testnet.",
};

export default function RadarAiPage() {
  return <RadarAiClient />;
}
