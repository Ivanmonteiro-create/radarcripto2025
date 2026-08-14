export function evaluateListingsRefresh(input: { now: Date; lastFetchedAt: Date | null; refreshMinutes: number }) {
  if (!input.lastFetchedAt) return { allowed: true as const, retryAfterSeconds: 0 };
  const remaining = input.refreshMinutes * 60_000 - (input.now.getTime() - input.lastFetchedAt.getTime());
  return remaining > 0 ? { allowed: false as const, retryAfterSeconds: Math.ceil(remaining / 1_000) } : { allowed: true as const, retryAfterSeconds: 0 };
}
