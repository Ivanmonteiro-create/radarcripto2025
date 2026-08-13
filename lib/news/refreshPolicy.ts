export function evaluateNewsRefresh(input: { now: Date; lastFetchedAt: Date | null; refreshMinutes: number }) {
  if (!input.lastFetchedAt) return { allowed: true as const, retryAfterSeconds: 0 };
  const remainingMs = input.refreshMinutes * 60_000 - (input.now.getTime() - input.lastFetchedAt.getTime());
  return remainingMs > 0
    ? { allowed: false as const, retryAfterSeconds: Math.ceil(remainingMs / 1_000) }
    : { allowed: true as const, retryAfterSeconds: 0 };
}
