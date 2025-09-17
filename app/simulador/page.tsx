// app/simulador/page.tsx
import TradingViewWidget from "@/components/TradingViewWidget";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function SimuladorPage() {
  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr 340px 200px" }}>
      {/* Gráfico */}
      <section className="panel" style={{ minHeight: "68dvh" }}>
        <div style={{ height: "66dvh" }}>
          <TradingViewWidget />
        </div>
      </section>

      {/* Controles de Trade (placeholder) */}
      <aside className="panel" style={{ minHeight: "68dvh" }}>
        <h2 style={{ marginTop: 0 }}>Controles de Trade</h2>
        <p className="muted small">
          (Fase 2) Aqui entram saldo inicial, risco %, par, Comprar/Vender/Resetar e histórico.
        </p>
        <p style={{marginTop:20}}>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </p>
      </aside>

      {/* Menu */}
      <Navbar />
    </main>
  );
}
