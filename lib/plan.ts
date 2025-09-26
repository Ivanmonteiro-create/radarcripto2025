// lib/plan.ts
export type PlanId = 'starter' | 'trader' | 'pro' | 'elite';

const KEY = 'rc_plan';

export function getDefaultPlan(): PlanId {
  return 'starter';
}

export function readPlan(): PlanId {
  if (typeof window === 'undefined') return getDefaultPlan();
  const v = window.localStorage.getItem(KEY);
  if (v === 'starter' || v === 'trader' || v === 'pro' || v === 'elite') return v;
  return getDefaultPlan();
}

export function savePlan(p: PlanId) {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, p);
}
