export type RadarUsageState = {
  now: Date;
  latestCreatedAt: Date | null;
  usedToday: number;
  rateLimitSeconds: number;
  dailyLimit: number;
};

export function evaluateRadarUsage(state: RadarUsageState): { allowed: true } | { allowed: false; code: "RADAR_AI_RATE_LIMITED" | "RADAR_AI_DAILY_LIMIT_REACHED" } {
  if (state.latestCreatedAt && state.now.getTime() - state.latestCreatedAt.getTime() < state.rateLimitSeconds * 1_000) {
    return { allowed: false, code: "RADAR_AI_RATE_LIMITED" };
  }
  if (state.dailyLimit > 0 && state.usedToday >= state.dailyLimit) {
    return { allowed: false, code: "RADAR_AI_DAILY_LIMIT_REACHED" };
  }
  return { allowed: true };
}
