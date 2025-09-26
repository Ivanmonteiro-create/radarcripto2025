'use client';

import React, { useMemo, useState } from 'react';

type Props = {
  symbol: string;
  onSymbolChange: (s: string) => void;
  onFullscreen?: () => void;
};

export default function TradeControls({ symbol, onSymbolChange, onFullscreen }: Props) {
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [tpPct, setTpPct] = useState<number | ''>('');
  const [slPct, setSlPct] = useState<number | ''>('');
  const [qtyRef, setQtyRef] = useState<number>(1000);

  const [history, setHistory] = useState<
    { side: 'BUY' | 'SELL'; symbol: string; price: number; ts: number; qtyRef: number; estQty: number }[]
  >([]);

  // ⚠️ seu preço real pode vir do feed — aqui mantive o mock para focar no CSV
  const price = useMemo(() => 116823.69, []);
  const sizeSuggestion = useMemo(
    () => (balance * (riskPct / 100)).toFixed(4),
    [balance, riskPct]
  );

  const now = () => Date.now();

  const handleBuy = () =>
    setHistory((h) => [
      {
        side: 'BUY',
        symbol,
        price,
        ts: now(),
        qtyRef,
        estQty: qtyRef > 0 && price > 0 ? qtyRef / price : 0,
      },
      ...h,
    ]);

  const handleSell = () =>
    setHistory((h) => [
      {
        side: 'SELL',
        symbol,
        price,
        ts: now(),
        qtyRef,
        estQty: qtyRef > 0 && price > 0 ? qtyRef / price : 0,
      },
      ...h,
    ]);

  const handleReset = () => setHistory([]);

  // ===== CSV =====
  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const fileStamp = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mi = pad2(d.getMinutes());
    const ss = pad2(d.getSeconds());
    return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
  };

  const toCSV = () => {
    const header = [
      'timestamp_iso',
      'data_local',
      'lado',
      'par',
      'preco',
      'qty_ref_usdt',
      'qtd_estimada',
    ];

    const rows = history.map((o) => {
      const iso = new Date(o.ts).toISOString();
      const local = new Date(o.ts).toLocaleString('pt-BR');
      // use ponto como decimal (CSV padrão) e 6 casas para quantidade
      const priceStr = o.price.toFixed(2);
      const qtyRefStr = o.qtyRef.toFixed(2);
      const estQtyStr = o.estQty.toFixed(6);
      return [iso, local, o.side, o.symbol, priceStr, qtyRefStr, estQtyStr];
    });

    const escapeCell = (v: string | number) => {
      const s = String(v);
      // Se contiver vírgula, aspas ou quebra de linha, envolve com aspas e escapa aspas internas
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [header, ...rows].map((r) => r.map(escapeCell).join(',')).join('\n');
    return csv;
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const csv = toCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radarcrypto-historico-${fileStamp()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="panel compactPanel compactRoot tradePanelShell"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}
    >
      {/* Cabeçalho */}
      <div className="compactHeader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 className="compactTitle" style={{ margin: 0 }}>Controles de Trade</h3>
        {onFullscreen && (
          <button
            type="button"
            onClick={onFullscreen}
            aria-label="Tela cheia"
            title="Tela cheia (F) / Sair (X)"
            className="chartFsBtn"
            style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
            </svg>
          </button>
        )}
      </div>

      {/* GRID 2×N compacto */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexGrow: 1 }}>
        {/* Linha 1 — Preço | Voltar */}
        <div>
          <div className="lbl">Preço</div>
          <div className="green">{price.toLocaleString('pt-BR')}</div>
        </div>
        <div>
          <a href="/" className="btn btn-primary" style={{ width: '100%' }}>
            Voltar ao início
          </a>
        </div>

        {/* Linha 2 */}
        <div>
          <div className="lbl">Equity</div>
          <div>{balance.toFixed(2)} USDT</div>
        </div>
        <div>
          <div className="lbl">PNL flutuante</div>
          <div>0.00 USDT (0.00%)</div>
        </div>

        {/* Linha 3 */}
        <div>
          <div className="lbl">Stop Loss (%)</div>
          <div className="twoCols">
            <input
              className="inp"
              type="number"
              placeholder="%"
              value={slPct === '' ? '' : slPct}
              onChange={(e) => setSlPct(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <button className="btn" onClick={() => setSlPct('')}>Zerar</button>
          </div>
        </div>
        <div>
          <div className="lbl">Saldo (USDT)</div>
          <input
            className="inp"
            type="number"
            min={0}
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
          />
        </div>

        {/* Linha 4 */}
        <div>
          <div className="lbl">Risco por trade (%)</div>
          <input
            className="inp"
            type="number"
            min={0}
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
          />
          <div className="xs muted">Tamanho sug.: {sizeSuggestion}</div>
        </div>
        <div>
          <div className="lbl">USDT p/ referência</div>
          <input
            className="inp"
            type="number"
            min={0}
            value={qtyRef}
            onChange={(e) => setQtyRef(Number(e.target.value))}
          />
        </div>

        {/* Linha 5 */}
        <div>
          <div className="lbl">Take Profit (%)</div>
          <div className="twoCols">
            <input
              className="inp"
              type="number"
              placeholder="%"
              value={tpPct === '' ? '' : tpPct}
              onChange={(e) => setTpPct(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <button className="btn" onClick={() => setTpPct('')}>Zerar</button>
          </div>
        </div>
        <div>
          <div className="lbl">Par</div>
          <select className="inp" value={symbol} onChange={(e) => onSymbolChange(e.target.value)}>
            <option>BTCUSDT</option>
            <option>ETHUSDT</option>
            <option>SOLUSDT</option>
            <option>BNBUSDT</option>
            <option>XRPUSDT</option>
            <option>ADAUSDT</option>
            <option>LINKUSDT</option>
            <option>DOGEUSDT</option>
          </select>
        </div>

        {/* Linha 6 – Botões */}
        <div>
          <button className="btn btnBuy" onClick={handleBuy} style={{ width: '100%' }}>
            Comprar
          </button>
        </div>
        <div>
          <button className="btn btnSell" onClick={handleSell} style={{ width: '100%' }}>
            Vender
          </button>
        </div>

        {/* Linha 7 – Reset / Export */}
        <div style={{ gridColumn: '1 / span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="btn" onClick={handleReset} style={{ width: '100%' }}>
            Resetar histórico
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV} disabled={history.length === 0} style={{ width: '100%' }}>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Histórico no rodapé */}
      <div className="cardMini historyCard" style={{ marginTop: 8 }}>
        <div className="cardTitle">Histórico</div>
        <div className="histWrap">
          {history.length === 0 && <div className="histRow">Sem operações ainda.</div>}
          {history.map((h, i) => (
            <div className="histRow" key={i}>
              {new Date(h.ts).toLocaleString('pt-BR')} — {h.side} {h.symbol} @ {h.price.toLocaleString('pt-BR')} (qty: {h.estQty.toFixed(6)})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
