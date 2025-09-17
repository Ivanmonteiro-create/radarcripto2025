// app/simulador/page.tsx
import TradingViewWidget from "@/components/TradingViewWidget";
import Navbar from "@/components/Navbar";

export default function SimuladorPage() {
  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr 360px 220px" }}>
      {/* Gráfico */}
      <section className="panel" style={{ minHeight: "70dvh" }}>
        <div style={{ height: "68dvh" }}>
          <TradingViewWidget />
        </div>
      </section>

      {/* Controles de Trade (placeholder) */}
      <aside className="panel" style={{ minHeight: "70dvh" }}>
        <h2 style={{ marginTop: 0 }}>Controles de Trade</h2>
        <p className="muted small">
          (Fase 2) Aqui entram saldo inicial, risco %, par, Comprar/Vender/Resetar e histórico.
        </p>
      </aside>

      {/* Menu */}
      <Navbar />
    </main>
  );
}
