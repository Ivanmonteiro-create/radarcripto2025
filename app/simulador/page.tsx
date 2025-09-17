// app/simulador/page.tsx
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";
import Link from "next/link";

export default function SimuladorPage() {
  // layout: gráfico ocupa tudo; à direita apenas os controles
  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr 360px" }}>
      {/* Gráfico ocupa toda a área útil à esquerda */}
      <section className="panel" style={{ minHeight: "78dvh" }}>
        <div style={{ height: "76dvh" }}>
          <TradingViewWidget />
        </div>
      </section>

      {/* Controles de Trade */}
      <aside className="panel" style={{ minHeight: "78dvh" }}>
        <TradeControls />
        <div style={{ marginTop: 16 }}>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </div>
      </aside>
    </main>
  );
}
