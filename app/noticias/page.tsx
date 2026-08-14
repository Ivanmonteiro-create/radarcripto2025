import type { Metadata } from "next";
import NewsRadarClient from "@/components/news/NewsRadarClient";

export const metadata: Metadata = {
  title: "Notícias e Eventos — RadarCrypto",
  description: "Eventos cripto consolidados a partir de fontes reais, com deduplicação e análise informativa.",
};

export default function NoticiasPage() {
  return <NewsRadarClient />;
}
