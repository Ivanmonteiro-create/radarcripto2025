// lib/priceFeed.ts
// Hook useLivePrice para conectar ao stream WebSocket da Binance (ticker stream)
// Fallback para REST polling se o WS não estiver disponível.
// Projetado para ser usado em componentes client (SimPageClient, TradeControls).
//
// Uso:
//   const price = useLivePrice("BTCUSDT");

type PriceListener = (p: number | undefined) => void;

type ConnState = {
  ws?: WebSocket;
  listeners: Set<PriceListener>;
  lastPrice?: number;
  reconnectTimer?: number | null;
  backoffMs: number;
  restPollTimer?: number | null;
  closedManually?: boolean;
};

const BASE_WS = "wss://stream.binance.com:9443/ws";
const BASE_REST = "https://api.binance.com/api/v3/ticker/price?symbol=";

// Map por símbolo (ex.: "BTCUSDT")
const connections: Map<string, ConnState> = new Map();

/** Normalize symbol: remove prefix/suffix spaces and uppercase */
function normalizeSymbol(sym: string) {
  return String(sym ?? "").trim().toUpperCase();
}

/** Convert symbol to stream name (lowercase) e.g. BTCUSDT -> btcusdt@ticker */
function streamNameFor(sym: string) {
  return `${sym.toLowerCase()}@ticker`;
}

/** Notify all listeners for a symbol */
function notifyListeners(sym: string, price: number | undefined) {
  const s = connections.get(sym);
  if (!s) return;
  s.lastPrice = price;
  s.listeners.forEach((fn) => {
    try { fn(price); } catch (err) { /* swallow listener errors */ }
  });
}

/** Start REST polling (fallback) - polls every `intervalMs` */
function startRestPolling(sym: string, intervalMs = 5000) {
  const state = connections.get(sym);
  if (!state) return;
  if (state.restPollTimer) return; // já rodando

  async function poll() {
    try {
      const res = await fetch(`${BASE_REST}${encodeURIComponent(sym)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`REST ${res.status}`);
      const j = await res.json();
      const p = typeof j?.price === "string" ? Number(j.price) : Number(j?.price);
      if (Number.isFinite(p)) notifyListeners(sym, p);
    } catch (err) {
      // ignora — continuará tentando
      // opcional: poderíamos notificar listeners com undefined em falhas prolongadas
    }
  }

  // primeira chamada imediata
  void poll();
  const id = window.setInterval(poll, intervalMs);
  state.restPollTimer = id;
}

/** Stop REST polling */
function stopRestPolling(sym: string) {
  const state = connections.get(sym);
  if (!state) return;
  if (state.restPollTimer) {
    clearInterval(state.restPollTimer);
    state.restPollTimer = null;
  }
}

/** Open a WebSocket connection for the symbol if not open */
function ensureWs(sym: string) {
  let state = connections.get(sym);
  if (!state) {
    state = { listeners: new Set(), backoffMs: 500, reconnectTimer: null, restPollTimer: null, closedManually: false };
    connections.set(sym, state);
  }

  // Se já tem socket OPEN or CONNECTING, não reabrir
  if (state.ws && (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING)) {
    // ensure REST polling is stopped if WS healthy
    if (state.ws.readyState === WebSocket.OPEN) stopRestPolling(sym);
    return;
  }

  const stream = streamNameFor(sym);
  const url = `${BASE_WS}/${stream}`;

  try {
    const ws = new WebSocket(url);
    state.ws = ws;
    state.closedManually = false;

    ws.onopen = () => {
      // console.debug(`[priceFeed] WS open ${sym}`);
      state!.backoffMs = 500; // reset backoff
      // stop REST polling since WS is open
      stopRestPolling(sym);
    };

    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        // ticker stream: last price available at 'c'
        const raw = d?.c;
        const p = typeof raw === "string" ? Number(raw) : Number(raw);
        if (Number.isFinite(p)) {
          notifyListeners(sym, p);
        }
      } catch (err) {
        // se parse falhar, ignora
      }
    };

    ws.onclose = () => {
      // console.debug(`[priceFeed] WS close ${sym}`);
      if (state!.closedManually) return;
      // tentamos reconectar com backoff exponencial (limitado)
      const next = Math.min(state!.backoffMs * 2, 30_000);
      state!.backoffMs = next;
      if (state!.reconnectTimer) clearTimeout(state!.reconnectTimer);
      state!.reconnectTimer = window.setTimeout(() => {
        state!.reconnectTimer = null;
        ensureWs(sym);
      }, state!.backoffMs);
      // start REST fallback while reconectamos
      startRestPolling(sym);
    };

    ws.onerror = () => {
      // console.debug(`[priceFeed] WS error ${sym}`);
      // O onclose tratará reconexão. Apenas fechar socket para provocar onclose.
      try { ws.close(); } catch (_) { /* noop */ }
    };
  } catch (err) {
    // erro ao criar WS (ex.: ambiente bloqueado) -> start REST fallback
    startRestPolling(sym);
  }
}

/** Close WS and timers for a symbol when no listeners */
function destroyConnectionIfUnused(sym: string) {
  const state = connections.get(sym);
  if (!state) return;
  if (state.listeners.size > 0) return;

  // marcar fechamento manual para não reconectar
  state.closedManually = true;

  if (state.ws) {
    try { state.ws.close(); } catch (_) { /* noop */ }
    state.ws = undefined;
  }
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
  stopRestPolling(sym);
  connections.delete(sym);
}

/** Subscribe a listener to a symbol; returns unsubscribe fn */
function subscribe(symRaw: string, listener: PriceListener) {
  const sym = normalizeSymbol(symRaw);
  if (!sym) {
    // retorna noop
    return () => {};
  }

  let state = connections.get(sym);
  if (!state) {
    state = { listeners: new Set(), backoffMs: 500, reconnectTimer: null, restPollTimer: null, closedManually: false };
    connections.set(sym, state);
  }

  state.listeners.add(listener);

  // se já tivermos preço conhecido, notifique imediatamente
  if (typeof state.lastPrice === "number") {
    try { listener(state.lastPrice); } catch (_) {}
  }

  // assegurar a conexão WS (ou fallback)
  ensureWs(sym);

  // retorno: unsubscribe
  return () => {
    const s = connections.get(sym);
    if (!s) return;
    s.listeners.delete(listener);
    // se nenhum listener restante, destruir recursos
    if (s.listeners.size === 0) destroyConnectionIfUnused(sym);
  };
}

/** Public hook: useLivePrice(symbol) -> number | undefined */
import { useEffect, useState } from "react";

export function useLivePrice(symbol: string | undefined) : number | undefined {
  const [price, setPrice] = useState<number | undefined>(() => {
    if (!symbol) return undefined;
    const n = normalizeSymbol(symbol);
    const s = connections.get(n);
    return s?.lastPrice;
  });

  useEffect(() => {
    if (!symbol) {
      setPrice(undefined);
      return;
    }
    const norm = normalizeSymbol(symbol);
    // subscribe and update local state on new prices
    const unsub = subscribe(norm, (p) => setPrice(p));
    // cleanup
    return () => { unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  return price;
}

/** Optional helper: getLastKnownPrice(symbol) */
export function getLastKnownPrice(symbol: string | undefined): number | undefined {
  if (!symbol) return undefined;
  const s = connections.get(normalizeSymbol(symbol));
  return s?.lastPrice;
}
