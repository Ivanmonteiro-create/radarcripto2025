// app/simulador/page.tsx
import TradingViewWidget from '@/components/TradingViewWidget';
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  return (
    <main className="wrapper">
      <section className="panel" style={{ gridColumn: '1 / span 2', minHeight: 520 }}>
        <TradingViewWidget symbol="BINANCE:BTCUSDT" />
      </section>

      <section className="panel compactPanel">
        <TradeControls />
      </section>
    </main>
  );
}
