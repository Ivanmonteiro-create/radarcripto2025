import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seed(client: PrismaClient = prisma) {
  const user = await client.user.upsert({
    where: { email: "internal@radarcrypto.local" },
    create: { email: "internal@radarcrypto.local", displayName: "RadarCrypto Internal" },
    update: {},
  });

  await client.systemControl.upsert({
    where: { id: "global" },
    create: { id: "global", killSwitchActive: false },
    update: {},
  });
  await client.systemSetting.upsert({
    where: { key: "trading.defaults" },
    create: {
      key: "trading.defaults",
      value: { mode: "SIM", maxPositions: 1, automaticActivation: false },
    },
    update: {},
  });

  const ema = await client.strategy.upsert({
    where: { kind_version: { kind: "EMA_CROSS", version: 1 } },
    create: {
      kind: "EMA_CROSS",
      name: "EMA Cross",
      version: 1,
      schema: { shortPeriod: 9, longPeriod: 21 },
    },
    update: {},
  });
  const percent = await client.strategy.upsert({
    where: { kind_version: { kind: "PERCENT_CYCLE", version: 1 } },
    create: {
      kind: "PERCENT_CYCLE",
      name: "Percent Cycle",
      version: 1,
      schema: { sellRisePct: 2, rebuyDropPct: 1 },
    },
    update: {},
  });

  const defaults = {
    userId: user.id,
    symbol: "BTCUSDT",
    mode: "SIM" as const,
    status: "STOPPED" as const,
    capitalUSDT: 1_000,
    maxCapitalUSDT: 1_000,
    maxOrderUSDT: 25,
    maxPositions: 1,
    maxDailyLossUSDT: 10,
    maxDrawdownPct: 5,
    minOrderIntervalMs: 300_000,
    takeProfitPct: 2,
    stopLossPct: 1,
  };
  await client.botConfig.upsert({
    where: { id: "seed-ema-cross" },
    create: {
      id: "seed-ema-cross",
      ...defaults,
      name: "EMA Cross Seed",
      strategyId: ema.id,
      strategyParams: { kind: "EMA_CROSS", shortPeriod: 9, longPeriod: 21 },
      runtime: { create: { status: "STOPPED", peakEquity: 1_000, strategyState: {} } },
    },
    update: {},
  });
  await client.botConfig.upsert({
    where: { id: "seed-percent-cycle" },
    create: {
      id: "seed-percent-cycle",
      ...defaults,
      name: "Percent Cycle Seed",
      strategyId: percent.id,
      strategyParams: { kind: "PERCENT_CYCLE", sellRisePct: 2, rebuyDropPct: 1 },
      runtime: { create: { status: "STOPPED", peakEquity: 1_000, strategyState: {} } },
    },
    update: {},
  });
}

if (process.env.NODE_ENV !== "test") {
  seed()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
      console.error(error instanceof Error ? error.message : "Seed failed");
      await prisma.$disconnect();
      process.exitCode = 1;
    });
}
