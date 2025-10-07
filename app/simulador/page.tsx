// app/simulador/page.tsx
import SimPageClient from "./SimPageClient";
// Server Component simples que apenas renderiza o cliente.
// Não usa next/dynamic aqui (evita o erro de "ssr:false não permitido").

import SimPageClient from './SimPageClient';

export default function Page() {
  return <SimPageClient initialSymbol="BTCUSDT" />;
  return <SimPageClient />;
