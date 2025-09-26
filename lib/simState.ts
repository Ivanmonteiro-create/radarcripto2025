// lib/simState.ts
export type Plan = 'free' | 'trader' | 'pro' | 'elite';

export type TradeHist = {
  side: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  ts: number;
};

export type SimState = {
  symbol: string;
  balance: number;
  riskPct: number;
  tpPct: number | '';
  slPct: number | '';
  qtyRef: number;
  history: TradeHist[];
};

const SIM_KEY = 'rc.sim.v1';
const PLAN_KEY = 'rc.plan.v1';

export function loadPlan(): Plan {
  if (typeof window === 'undefined') return 'free';
  const url = new URL(window.location.href);
  const q = (url.searchParams.get('plan') || '').toLowerCase() as Plan | '';
  const fromQuery: Plan | null = q && ['free','trader','pro','elite'].includes(q) ? q : null;

  const stored = (localStorage.getItem(PLAN_KEY) || '') as Plan | '';
  const fromStore: Plan | null = stored && ['free','trader','pro','elite'].includes(stored) ? stored : null;

  const plan = fromQuery ?? fromStore ?? 'free';
  try { localStorage.setItem(PLAN_KEY, plan); } catch {}
  return plan;
}

export function setPlan(plan: Plan) {
  try { localStorage.setItem(PLAN_KEY, plan); } catch {}
}

export function loadSimState(): SimState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SIM_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj as SimState;
  } catch {
    return null;
  }
}

let saveTimer: number | null = null;
export function saveSimState(s: SimState) {
  if (typeof window === 'undefined') return;
  // debounce ~200ms para evitar gravar a cada tecla
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try { localStorage.setItem(SIM_KEY, JSON.stringify(s)); } catch {}
  }, 200);
}
