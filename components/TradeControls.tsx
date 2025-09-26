'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan, SimState, TradeHist } from '@/lib/simState';
import { loadSimState, saveSimState } from '@/lib/simState';

type Props = {
  plan: Plan;
  symbol: string;
  onSymbolChange: (s: string) => void;
  onFullscreen?: () => void;
};

const DEFAULT_STATE: SimState = {
  symbol: 'BTCUSDT',
  balance: 10000,
  riskPct: 1,
  tpPct: '',
  slPct: '',
  qtyRef: 1000,
  history: [],
};

export default function TradeControls({ plan, symbol, onSymbolChange, onFullscreen }: Props) {
  // ===== estado principal
  const [balance, setBalance] = useState<number>(DEFAULT_STATE.balance);
  const [riskPct, setRiskPct] = useState<number>(DEFAULT_STATE.riskPct);
  const [tpPct, setTpPct] = useState<number | ''>(DEFAULT_STATE.tpPct);
  const [slPct, setSlPct] = useState<number | ''>(DEFAULT_STATE.slPct);
  const [qtyRef, setQtyRef] = useState<number>(DEFAULT_STATE.qtyRef);
  const [history, setHistory] = useState<TradeHist[]>([]);

  // ===== restaura estado salvo
  useEffect(() => {
    const saved = loadSimState();
    if (!saved) return;
    setBalance(saved.balance ?? DEFAULT_STATE.balance);
    setRiskPct(saved.riskPct ?? DEFAULT_STATE.riskPct);
    setTpPct(saved.tpPct ?? DEFAULT_STATE.tpPct);
    setSlPct(saved.slPct ?? DEFAULT_STATE.slPct);
    setQtyRef(saved.qtyRef ?? DEFAULT_STATE.qtyRef);
    setHistory(Array.isArray(saved.history) ? saved.history : []);
    if (saved.symbol) onSymbolChange(saved.symbol);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== salva estado (debounced dentro de saveSimState)
  useEffect(() => {
    const s: SimState = {
      symbol,
      balance,
      riskPct,
      tpPct,
      slPct,
      qtyRef,
      history,
    };
    saveSimState(s);
  }, [symbol, balance, riskPct, tpPct, slPct, qtyRef, history]);

  // ===== cálculos
  const price = useMemo(() => 116823.69, []); // placeholder; seu feed já atualiza no widget
  const sizeSuggestion = useMemo(() => (balance * (riskPct / 100)).toFixed(4), [balance, riskPct]);

  // ===== handlers
  const pushTrade = (side: 'BUY' | 'SELL') => {
    const entry: TradeHist = { side, symbol, price, ts: Date.now() };
    setHistory((h) => [entry, ...h].slice(0, 200));
  };

  const handleBuy = () => pushTrade('BUY');
  const handleSell = () => pushTrade('SELL');
  const handleReset = () => setHistory([]);

  // ===== flags por plano (front apenas)
  const isFree = plan === 'free';
  const isBalanceZero = balance <= 0;

  const buySellDisabled = isBalanceZero; // no free, ainda permitimos operar; só travamos se saldo acaba
  const buySellTitle = isBalanceZero
    ? 'Saldo zerado — faça upgrade para recarregar'
    : undefined;

  return (
    <div
      className="panel compactPanel compactRoot tradePanelShell"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}
    >
      {/* Cabeçalho */}
      <div className="compactHeader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 className="compactTitle" style={{ margin: 0 }}>
          Controles de Trade
        </h3>

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

      {/* Badge de plano (só informativo, sem mudar layout) */}
      <div className="xs muted" style={{ marginTop: -4 }}>
        Plano atual: <strong style={{ color: '#1cff80' }}>{plan.toUpperCase()}</strong>{' '}
        {isFree && '— Spot liberado. Recursos avançados serão desbloqueados no upgrade.'}
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
          <select
            className="inp"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
          >
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
          <button
            className="btn btnBuy"
            onClick={handleBuy}
            style={{ width: '100%' }}
            disabled={buySellDisabled}
            title={buySellTitle}
          >
            Comprar
          </button>
        </div>
        <div>
          <button
            className="btn btnSell"
            onClick={handleSell}
            style={{ width: '100%' }}
            disabled={buySellDisabled}
            title={buySellTitle}
          >
            Vender
          </button>
        </div>

        {/* Linha 7 – Reset */}
        <div style={{ gridColumn: '1 / span 2' }}>
          <button className="btn" onClick={handleReset} style={{ width: '100%' }}>
            Resetar histórico
          </button>
        </div>
      </div>

      {/* Aviso de saldo zerado (mostra só quando necessário) */}
      {isBalanceZero && (
        <div className="cardMini" style={{ marginTop: 4 }}>
          <div className="xs" style={{ color: '#ffb3b3' }}>
            Seu saldo está zerado. No próximo passo, o upgrade de plano permitirá recarga automática.
          </div>
        </div>
      )}

      {/* Histórico no rodapé */}
      <div className="cardMini historyCard" style={{ marginTop: 8 }}>
        <div className="cardTitle">Histórico</div>
        <div className="histWrap">
          {history.length === 0 && <div className="histRow">Sem operações ainda.</div>}
          {history.map((h, i) => (
            <div className="histRow" key={i}>
              {new Date(h.ts).toLocaleString('pt-BR')} — {h.side} {h.symbol} @ {h.price.toLocaleString('pt-BR')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
