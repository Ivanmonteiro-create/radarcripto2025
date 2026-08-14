import type { Metadata } from "next";
import ListingRadarClient from "@/components/listings/ListingRadarClient";

export const metadata: Metadata = {
  title: "Listagens e Delistagens — RadarCrypto",
  description: "Eventos oficiais de listagens e delistagens, enriquecidos com dados públicos de mercado.",
};

export default function ListagensPage() { return <ListingRadarClient />; }
