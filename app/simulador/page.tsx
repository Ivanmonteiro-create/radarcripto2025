// app/simulador/page.tsx  (Server Component)
import dynamic from "next/dynamic";

// carrega o cliente sem SSR (TradingView precisa do window)
const SimPageClient = dynamic(() => import("./SimPageClient"), { ssr: false });

export default function Page() {
  return <SimPageClient />;
}
