'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import { priceFeed } from '@/lib/priceFeed'; // <<<<<< ajuste: import nomeado

type Pair =
  | 'BTCUSDT'
  | 'ETHUSDT'
  | 'BNBUSDT'
  | 'SOLUSDT'
  | 'ADAUSDT'
  | 'XRPUSDT'
  | 'DOGEUSDT'
  | 'LINKUSDT';

type Side = 'buy' | 'sell';

type Trade = {
  id: string;
  time: number;
  pair: Pair;
  side: Side;
  entryPrice: number;
  sizeUSDT: number;
  qty: number;
  tp?: number | null;
  sl?: number | null;
  status: 'open' | 'closed';
  exitPrice?: number;
  pnl?: number;
};

const fmt = (n: number) =>
  isFinite(n) ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

function unrealized(tr: Trade, last: number): number {
  const dir = tr.side === 'buy' ? 1 : -1;
  return (last - tr.entryPrice) * tr.qty * dir;
}

export default function SimpageClient() {
  const [pair, setPair] = useState<Pair>('BTCUSDT');
  const [lastPrice, setLastPrice] = useState<number>(0);

  const [riskPct, setRiskPct] = useState<number>(1);
  const [balance, setBalance] = useState<number>(100000);
  const [sizeUSDT, setSizeUSDT] = useState<number>(100000);
  const [tpPrice, setTpPrice] = useState<number | ''>('');
  const [slPrice, setSlPrice] = useState<number | ''>('');

  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    let off = () => {};
    try {
      off = priceFeed.subscribe(pair, (p: number) => setLastPrice(p));
    } catch {}
    return () => off();
  }, [pair]);

  const unrealizedPnL = useMemo(
    () => trades.filter(t => t.status === 'open').reduce((acc, t) => acc + unrealized(t, lastPrice), 0),
    [trades, lastPrice]
  );

  const realizedPnL = useMemo(
    () => trades.filter(t => t.status === 'closed').reduce((acc, t) => acc + (t.pnl ?? 0), 0),
    [trades]
  );

  const equity = useMemo(() => balance + realizedPnL + unrealizedPnL, [balance, realizedPnL, unrealizedPnL]);

  const positionQty = useMemo(
    () =>
      trades.filter(t => t.status === 'open').reduce((acc, t) => acc + (t.side === 'buy' ? t.qty : -t.qty), 0),
    [trades]
  );

  function place(side: Side) {
    if (!lastPrice || sizeUSDT <= 0) return;

    const maxRiskUSDT = (riskPct / 100) * equity;
    const effectiveSize = Math.min(sizeUSDT, Math.max(10, maxRiskUSDT));
    const qty = effectiveSize / lastPrice;

    const tr: Trade = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: Date.now(),
      pair,
      side,
      entryPrice: lastPrice,
      sizeUSDT: effectiveSize,
      qty,
      tp: tpPrice === '' ? null : Number(tpPrice),
      sl: slPrice === '' ? null : Number(slPrice),
      status: 'open',
    };

    setTrades(prev => [tr, ...prev]);
  }

  const watcherRef = useRef<number | null>(null);
  useEffect(() => {
    if (watcherRef.current) clearInterval(watcherRef.current);
    watcherRef.current = window.setInterval(() => {
      setTrades(prev => {
        let changed = false;
        const next = prev.map(t => {
          if (t.status === 'open' && lastPrice) {
            const dir = t.side === 'buy' ? 1 : -1;
            const hitTP =
              typeof t.tp === 'number' && ((dir === 1 && lastPrice >= t.tp) || (dir === -1 && lastPrice <= t.tp));
            const hitSL =
              typeof t.sl === 'number' && ((dir === 1 && lastPrice <= t.sl) || (dir === -1 && lastPrice >= t.sl));
            if (hitTP || hitSL) {
              const pnl = unrealized(t, lastPrice);
              changed = true;
              return { ...t, status: 'closed', exitPrice: lastPrice, pnl };
            }
          }
          return t;
        });
        return changed ? next : prev;
      });
    }, 500);
    return () => {
      if (watcherRef.current) clearInterval(watcherRef.current);
    };
  }, [lastPrice]);

  function resetHistory() {
    setTrades([]);
    setTpPrice('');
    setSlPrice('');
  }

  function exportCSV() {
    const headers = [
      'time',
      'pair',
      'side',
      'entryPrice',
      'tp',
      'sl',
      'sizeUSDT',
      'qty',
      'status',
      'exitPrice',
      'pnl',
    ];
    const rows = trades.map(t => [
      new Date(t.time).toISOString(),
      t.pair,
      t.side,
      t.entryPrice,
      t.tp ?? '',
      t.sl ?? '',
      t.sizeUSDT,
      t.qty,
      t.status,
      t.exitPrice ?? '',
      t.pnl ?? '',
    ]);
    const csv = [headers, ...rows]
      .map(r =>
        r
          .map(v => {
            const s = String(v);
            return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(';')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `historico_${pair}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="w-full h-full grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-8">
        <div className="rounded-2xl border border-zinc-700/60 overflow-hidden">
          <TradingViewWidget symbol={pair} />
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4">
        <div className="rounded-2xl border border-zinc-700/60 p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Controles de Trade</h3>
            <a href="/" className="btn btn-sm btn-success">Voltar ao início</a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs opacity-70">Par</label>
              <select
                className="w-full rounded-lg bg-zinc-800/70 px-3 py-2 outline-none"
                value={pair}
                onChange={e => setPair(e.target.value as Pair)}
              >
                <option>BTCUSDT</option>
                <option>ETHUSDT</option>
                <option>BNBUSDT</option>
                <option>SOLUSDT</option>
                <option>ADAUSDT</option>
                <option>XRPUSDT</option>
                <option>DOGEUSDT</option>
                <option>LINKUSDT</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">PNL</label>
              <div className="w-full rounded-lg bg-zinc-800/70 px-3 py-2">
                {fmt(realizedPnL + unrealizedPnL)}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">Preço ao vivo</label>
              <div className="w-full rounded-lg bg-zinc-800/70 px-3 py-2">{fmt(lastPrice)}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">Equity</label>
              <div className="w-full rounded-lg bg-zinc-800/70 px-3 py-2">{fmt(equity)}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">Risco por trade (%)</label>
              <input
                type="number"
                className="w-full rounded-lg bg-zinc-800/70 px-3 py-2 outline-none"
                value={riskPct}
                onChange={e => setRiskPct(Number(e.target.value))}
                min={0.1}
                step={0.1}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">Saldo (USDT)</label>
              <input
                type="number"
                className="w-full rounded-lg bg-zinc-800/70 px-3 py-2 outline-none"
                value={balance}
                onChange={e => setBalance(Number(e.target.value))}
                min={0}
                step={100}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">Tamanho (USDT)</label>
              <input
                type="number"
                className="w-full rounded-lg bg-zinc-800/70 px-3 py-2 outline-none"
                value={sizeUSDT}
                onChange={e => setSizeUSDT(Number(e.target.value))}
                min={10}
                step={10}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">Tamanho de posição</label>
              <div className="w-full rounded-lg bg-zinc-800/70 px-3 py-2">{fmt(positionQty)}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">TP (preço)</label>
              <input
                type="number"
                className="w-full rounded-lg bg-zinc-800/70 px-3 py-2 outline-none"
                value={tpPrice}
                onChange={e => setTpPrice(e.target.value === '' ? '' : Number(e.target.value))}
                min={0}
                step={0.0001}
                placeholder="opcional"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">SL (preço)</label>
              <input
                type="number"
                className="w-full rounded-lg bg-zinc-800/70 px-3 py-2 outline-none"
                value={slPrice}
                onChange={e => setSlPrice(e.target.value === '' ? '' : Number(e.target.value))}
                min={0}
                step={0.0001}
                placeholder="opcional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button className="rounded-lg px-3 py-2 bg-emerald-600 hover:bg-emerald-500 transition" onClick={() => place('buy')}>
              Comprar
            </button>
            <button className="rounded-lg px-3 py-2 bg-rose-600 hover:bg-rose-500 transition" onClick={() => place('sell')}>
              Vender
            </button>
            <button className="rounded-lg px-3 py-2 bg-zinc-700 hover:bg-zinc-600 transition" onClick={resetHistory}>
              Resetar histórico
            </button>
            <button className="rounded-lg px-3 py-2 bg-zinc-700 hover:bg-zinc-600 transition" onClick={exportCSV}>
              Exportar CSV
            </button>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">Histórico</div>
            {trades.length === 0 ? (
              <div className="text-xs opacity-60">Sem operações ainda.</div>
            ) : (
              <div className="max-h-60 overflow-auto rounded-lg border border-zinc-700/50">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-800/60">
                    <tr>
                      <th className="p-2 text-left">Data/Hora</th>
                      <th className="p-2 text-left">Par</th>
                      <th className="p-2 text-left">Side</th>
                      <th className="p-2 text-right">Entrada</th>
                      <th className="p-2 text-right">TP</th>
                      <th className="p-2 text-right">SL</th>
                      <th className="p-2 text-right">USDT</th>
                      <th className="p-2 text-right">Qtd</th>
                      <th className="p-2 text-right">Status</th>
                      <th className="p-2 text-right">Saída</th>
                      <th className="p-2 text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(t => {
                      const u = t.status === 'open' ? unrealized(t, lastPrice) : t.pnl ?? 0;
                      return (
                        <tr key={t.id} className="odd:bg-zinc-900/40">
                          <td className="p-2">{new Date(t.time).toLocaleString()}</td>
                          <td className="p-2">{t.pair}</td>
                          <td className="p-2">{t.side}</td>
                          <td className="p-2 text-right">{fmt(t.entryPrice)}</td>
                          <td className="p-2 text-right">{t.tp ? fmt(t.tp) : '-'}</td>
                          <td className="p-2 text-right">{t.sl ? fmt(t.sl) : '-'}</td>
                          <td className="p-2 text-right">{fmt(t.sizeUSDT)}</td>
                          <td className="p-2 text-right">{fmt(t.qty)}</td>
                          <td className="p-2 text-right">{t.status}</td>
                          <td className="p-2 text-right">{t.exitPrice ? fmt(t.exitPrice) : '-'}</td>
                          <td className={`p-2 text-right ${u >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(u)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
