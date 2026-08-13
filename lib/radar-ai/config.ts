function boundedInteger(name: string, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return parsed;
}

export function getRadarAiConfig() {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_RADAR_MODEL ?? "gpt-5.6",
    timeoutMs: boundedInteger("RADAR_AI_TIMEOUT_MS", 20_000, 1_000, 60_000),
    rateLimitSeconds: boundedInteger("RADAR_AI_RATE_LIMIT_SECONDS", 60, 1, 3_600),
    dailyLimit: boundedInteger("RADAR_AI_DAILY_LIMIT", 0, 0, 10_000),
  };
}
