'use client';

import React, { useMemo, useState, useCallback } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import TradeControls from '@/components/TradeControls';

// ajuste este import conforme a posição real do seu hook/função:
import { usePriceFeed } from '@/priceFeed'; // se o seu arquivo estiver em "/priceFeed.ts"

export default function SimPageClient() {
  // símbolo inicial
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  // preço ao vivo do par (hook existente no seu projeto)
  const livePrice = usePriceFeed(symbol); // retorna number|undefined

  // estes números podem vir do seu estado global/localStorage/api etc.
  // por enquanto, mantemos valores de exemplo (0) para não quebrar nada:
  const equity = 100000;      // ex.: USDT virtual
  const balance = 100000;     // idem
  const positionSize = 0;     // sem posição por padrão
  const pnlUnrealized = 0;    // sem PnL por padrão

  const onReset = useCallback(() => {
    // aqui você pode limpar posições/estado, se existir
    // por enquanto só rola pro topo (mantém comportamento visual)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const onExportCsv = useCallback(() => {
    // plugue aqui sua rotina real de exportação
    // deixamos um placeholder para manter o botão funcional
    alert('Exportar CSV: em breve');
  }, []);

  return (
    <div className="wrapper" style={{ gridTemplateColumns: '1fr 360px' }}>
      {/* Coluna esquerda = Gráfico */}
      <section className="panel" style={{ minHeight: 'calc(100dvh - 32px)', display: 'flex', flexDirection: 'column' }}>
        <div className="compactHeader" style={{ marginBottom: 8 }}>
          <h3 className="compactTitle">Gráfico — {symbol}</h3>
          {/* o botão de tela cheia nativo do TradingView já aparece dentro do widget;
              o nosso CSS global o alinha na mesma linha da câmera */}
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
