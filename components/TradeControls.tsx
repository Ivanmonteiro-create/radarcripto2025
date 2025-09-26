'use client';

import React from 'react';

type Props = {
  /** par atual, ex.: 'BTCUSDT' */
  symbol: string;
  /** preço em tempo real do par (se não vier, mostra “—”) */
  livePrice?: number;

  /** métricas da conta/posição (se você já tiver esses números em outro lugar, passe aqui) */
  equity?: number;          // patrimônio total (USDT)
  balance?: number;         // saldo livre (USDT)
  positionSize?: number;    // tamanho da posição (USDT)
  pnlUnrealized?: number;   // PnL não-realizado (USDT)

  /** handlers opcionais */
  onSymbolChange?: (s: string) => void;

  /** ações (você pode adaptar aos seus nomes) */
  onBuy?: () => void;
  onSell?: () => void;
  onReset?: () => void;
  onExportCsv?: () => void;
};

export default function TradeControls({
  symbol,
  livePrice,
  equity,
  balance,
  positionSize,
  pnlUnrealized,
  onSymbolChange,
  onBuy,
  onSell,
  onReset,
  onExportCsv,
}: Props) {
  const fmt = (n?: number) =>
    typeof n === 'number' ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

  const pnlColor =
    typeof pnlUnrealized === 'number'
      ? pnlUnrealized > 0
        ? '#1cff80'
        : pnlUnrealized < 0
        ? '#ff6b6b'
        : '#d5fbe6'
      : '#d5fbe6';

  return (
    <aside className="panel compactPanel compactRoot" style={{ minWidth: 300 }}>
      {/* Cabeçalho do painel */}
      <div className="compactHeader">
        <h3 className="compactTitle">Controles de Trade</h3>
        <div className="tcHeaderActions">
          <button className="btn tcBackBtn" onClick={onReset}>Voltar ao início</button>
        </div>
      </div>

      <div className="cardMini" style={{ gap: 10 }}>
        {/* Indicadores em tempo real */}
        <div className="aboutCard" style={{ background: 'rgba(255,255,255,.02)' }}>
          <div className="cardHead" style={{ marginBottom: 6 }}>
            <strong className="aboutCardTitle" style={{ margin: 0 }}>Indicadores (ao vivo)</strong>
          </div>

          <div className="twoCols">
            <div>
              <div className="lbl">Par</div>
              <div className="fakeInput" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 800 }}>{symbol}</span>
                {onSymbolChange && (
                  <select
                    value={symbol}
                    onChange={(e) => onSymbolChange(e.target.value)}
                    className="inp"
                    style={{ height: 28, padding: '0 8px', width: 120 }}
                  >
                    <option>BTCUSDT</option>
                    <option>ETHUSDT</option>
                    <option>BNBUSDT</option>
                    <option>SOLUSDT</option>
                  </select>
                )}
              </div>
            </div>

            <div>
              <div className="lbl">Preço ao vivo</div>
              <div className="fakeInput" style={{ fontWeight: 800, color: '#1cff80' }}>
                {fmt(livePrice)}
              </div>
            </div>
          </div>

          <div className="threeCols" style={{ marginTop: 8 }}>
            <div>
              <div className="lbl">PNL (não-realizado)</div>
              <div className="fakeInput" style={{ fontWeight: 800, color: pnlColor }}>
                {fmt(pnlUnrealized)} USDT
              </div>
            </div>
            <div>
              <div className="lbl">Equity</div>
              <div className="fakeInput" style={{ fontWeight: 800 }}>{fmt(equity)} USDT</div>
            </div>
            <div>
              <div className="lbl">Saldo (USDT)</div>
              <div className="fakeInput" style={{ fontWeight: 800 }}>{fmt(balance)} USDT</div>
            </div>
          </div>

          <div className="twoCols" style={{ marginTop: 8 }}>
            <div>
              <div className="lbl">Tamanho da posição</div>
              <div className="fakeInput" style={{ fontWeight: 800 }}>{fmt(positionSize)} USDT</div>
            </div>
            <div>
              <div className="lbl">Ações</div>
              <div className="actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn btnBuy" onClick={onBuy}>Comprar</button>
                <button className="btn btnSell" onClick={onSell}>Vender</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn" onClick={onReset}>Zerar</button>
            <button className="btn" onClick={onExportCsv}>Exportar CSV</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
