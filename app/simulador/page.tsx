// app/simulador/page.tsx
import dynamic from "next/dynamic";

// Renderiza só no cliente (o widget do TradingView precisa de window)
const SimPageClient = dynamic(() => import("./SimPageClient"), { ssr: false });

export default function Page() {
  return <SimPageClient />;
}
