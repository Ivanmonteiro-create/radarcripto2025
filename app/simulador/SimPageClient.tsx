'use client';

import React, { useState, useCallback } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import TradeControls from '@/components/TradeControls';

// ⬇️ caminho CORRETO para quem tem priceFeed.ts na raiz do projeto
import { usePriceFeed } from '../../priceFeed';

export default function SimPageClient() {
  // símbolo inicial
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  // preço ao vivo do par
  const livePrice = usePriceFeed(symbol); // retorna number | undefined

  // números de exemplo (substitua pelos seus estados reais quando quiser)
  const equity = 100000;
  const balance = 100000;
  const positionSize = 0;
  const pnlUnrealized = 0;

  const onReset = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const onExportCsv = useCallback(() => {
    alert('Exportar CSV: em breve');
  }, []);

  return (
    <div className="wrapper" style={{ gridTemplateColumns: '1fr 360px' }}>
      {/* Coluna esquerda = Gráfico */}
      <section className="panel" style={{ minHeight: 'calc(100dvh - 32px)', display: 'flex', flexDirection: 'column' }}>
        <div className="compactHeader" style={{ marginBottom: 8 }}>
          <h3 className="compactTitle">Gráfico — {symbol}</h3>
        </div>

        <div style={{ flex: 1, minHeight: 520 }}>
          <TradingViewWidget
            symbol={symbol}
            autosize
            height={600}
            interval="1"
            theme="dark"
          />
        </div>
      </section>

      {/* Coluna direita = Painel */}
      <TradeControls
        symbol={symbol}
        livePrice={livePrice}
        equity={equity}
        balance={balance}
        positionSize={positionSize}
        pnlUnrealized={pnlUnrealized}
        onSymbolChange={setSymbol}
        onBuy={() => alert('Comprar')}
        onSell={() => alert('Vender')}
        onReset={onReset}
        onExportCsv={onExportCsv}
      />
    </div>
  );
}
