'use client';

import { useState } from 'react';
import Link from 'next/link';
import TradingViewWidget from '@/components/TradingViewWidget';
import TradeControls from '@/components/TradeControls';

/**
 * Cliente: controla o símbolo e monta o layout (gráfico à esquerda, controles à direita)
 */
export default function SimPageClient() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  return (
    <main className="wrapper" style={{ alignItems: 'stretch' }}>
      {/* Coluna esquerda – Gráfico ocupando o alto */}
      <section className="panel" style={{ gridColumn: '1 / span 2', minHeight: 560 }}>
        {/* Cabeçalho pequeno com "Voltar ao início" no topo direito */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <Link href="/" className="btn tcBackBtn">
            Voltar ao início
          </Link>
        </div>

        {/* Gráfico ocupa o resto da altura do painel */}
        <div style={{ height: 'calc(100% - 44px)' }}>
          <TradingViewWidget symbol={symbol} autosize />
        </div>
      </section>

      {/* Coluna direita – Controles */}
      <aside className="panel" style={{ minWidth: 280 }}>
        <h3 className="compactTitle" style={{ marginBottom: 8, fontSize: 18 }}>Controles de Trade</h3>

        {/* O componente de controles já existia no seu projeto.
            Passamos somente as props que ele conhece: symbol e onSymbolChange. */}
        <TradeControls symbol={symbol} onSymbolChange={setSymbol} />
      </aside>
    </main>
  );
}
