// lib/csv.ts
import type { Trade } from "./tradeEngine";

export function exportTradesCSV(trades: Trade[], filename = "historico.csv") {
  const headers = [
    "id","datetime","symbol","side","qty","price","notional_usdt","fee_usdt"
  ];
  const rows = trades.map(t => [
    t.id,
    new Date(t.time).toISOString(),
    t.symbol,
    t.side,
    toFixed6(t.qty),
    toFixed2(t.price),
    toFixed2(t.qty * t.price),
    toFixed2(t.fee),
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const toFixed2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const toFixed6 = (n: number) => (Math.round(n * 1e6) / 1e6).toFixed(6);
