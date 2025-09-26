// app/simulador/page.tsx
import dynamic from "next/dynamic";

// carrega a página cliente (precisamos de window para o TradingView)
const SimPageClient = dynamic(() => import("./SimPageClient"), { ssr: false });

export default function Page() {
  return <SimPageClient />;
}
