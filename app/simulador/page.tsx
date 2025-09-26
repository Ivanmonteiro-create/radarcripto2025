// app/simulador/page.tsx
import dynamic from "next/dynamic";

// Carrega o cliente sem SSR (TradingView precisa de window)
const SimPageClient = dynamic(() => import("./SimPageClient"), { ssr: false });

export default function Page() {
  return <SimPageClient />;
}
