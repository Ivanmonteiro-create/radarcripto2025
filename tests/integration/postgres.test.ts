import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seed } from "../../prisma/seed";

const testUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = testUrl ? describe : describe.skip;
const client = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null;

describeDatabase("PATCH 02 PostgreSQL integration", () => {
  beforeAll(async () => {
    const rows = await client!.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
    if (!/(test|patch02)/i.test(rows[0]?.database ?? "")) throw new Error("Integration tests refused a database not identified as test/patch02");
    await client!.fill.deleteMany({ where: { orderId: "integration-order" } });
    await client!.trade.deleteMany({ where: { orderId: "integration-order" } });
    await client!.order.deleteMany({ where: { id: "integration-order" } });
    await client!.position.deleteMany({ where: { id: "integration-position" } });
    await client!.balanceSnapshot.deleteMany({ where: { id: "integration-balance" } });
  });

  afterAll(async () => {
    if (!client) return;
    await client.fill.deleteMany({ where: { orderId: "integration-order" } });
    await client.trade.deleteMany({ where: { orderId: "integration-order" } });
    await client.order.deleteMany({ where: { id: "integration-order" } });
    await client.position.deleteMany({ where: { id: "integration-position" } });
    await client.balanceSnapshot.deleteMany({ where: { id: "integration-balance" } });
    await client.systemSetting.deleteMany({ where: { key: "integration.persistence" } });
    await client.$disconnect();
  });

  it("has applied migrations and keeps the seed idempotent", async () => {
    await seed(client!);
    await seed(client!);
    expect(await client!.user.count({ where: { email: "internal@radarcrypto.local" } })).toBe(1);
    expect(await client!.botConfig.count({ where: { id: { in: ["seed-ema-cross", "seed-percent-cycle"] } } })).toBe(2);
    expect(await client!.botConfig.count({ where: { id: { in: ["seed-ema-cross", "seed-percent-cycle"] }, status: "STOPPED" } })).toBe(2);
    expect(await client!.exchangeAccount.count()).toBe(0);
  });

  it("persists configuration across a new Prisma client", async () => {
    await client!.systemSetting.upsert({
      where: { key: "integration.persistence" },
      create: { key: "integration.persistence", value: { revision: 1 } },
      update: { value: { revision: 1 } },
    });
    await client!.systemSetting.update({ where: { key: "integration.persistence" }, data: { value: { revision: 2 } } });
    const restarted = new PrismaClient({ datasources: { db: { url: testUrl! } } });
    expect(await restarted.systemSetting.findUnique({ where: { key: "integration.persistence" } })).toMatchObject({ value: { revision: 2 } });
    await restarted.$disconnect();
  });

  it("persists partial/full order state, fills, position, balance and kill switch", async () => {
    const bot = await client!.botConfig.findUniqueOrThrow({ where: { id: "seed-ema-cross" } });
    await client!.order.create({ data: {
      id: "integration-order", botId: bot.id, clientOrderId: `integration-${Date.now()}`,
      symbol: bot.symbol, side: "BUY", type: "LIMIT", status: "PARTIALLY_FILLED",
      requestedQuantity: 0.002, executedQuantity: 0.001, requestedPrice: 50_000,
    } });
    await client!.fill.create({ data: {
      botId: bot.id, orderId: "integration-order", exchangeFillId: "fill-1", symbol: bot.symbol,
      side: "BUY", price: 50_000, quantity: 0.001, feeQuote: 0.01, feeAsset: "USDT", feeAmount: 0.01, timestamp: new Date(),
    } });
    await expect(client!.fill.create({ data: {
      botId: bot.id, orderId: "integration-order", exchangeFillId: "fill-1", symbol: bot.symbol,
      side: "BUY", price: 50_000, quantity: 0.001, timestamp: new Date(),
    } })).rejects.toThrow();
    await client!.position.create({ data: {
      id: "integration-position",
      botId: bot.id, symbol: bot.symbol, quantity: 0.001, averageEntryPrice: 50_000,
      costBasisQuote: 50.01, openedAt: new Date(),
    } });
    await client!.order.update({ where: { id: "integration-order" }, data: { status: "FILLED", executedQuantity: 0.002 } });
    await client!.balanceSnapshot.create({ data: {
      id: "integration-balance",
      botId: bot.id, asset: "USDT", free: 900, locked: 0, total: 900, equityUSDT: 1_000,
    } });
    await client!.systemControl.update({ where: { id: "global" }, data: { killSwitchActive: true, reason: "integration test" } });
    expect((await client!.order.findUniqueOrThrow({ where: { id: "integration-order" }, include: { fills: true } })).fills).toHaveLength(1);
    expect((await client!.position.findFirstOrThrow({ where: { botId: bot.id, isOpen: true } })).quantity.toString()).toBe("0.001");
    expect((await client!.systemControl.findUniqueOrThrow({ where: { id: "global" } })).killSwitchActive).toBe(true);
    await client!.systemControl.update({ where: { id: "global" }, data: { killSwitchActive: false, reason: null } });
  });

  it("enforces an advisory lock and preserves state across worker restart", async () => {
    const contender = new PrismaClient({ datasources: { db: { url: testUrl! } } });
    let releaseLock!: () => void;
    let locked!: () => void;
    const acquired = new Promise<void>((resolve) => { locked = resolve; });
    const release = new Promise<void>((resolve) => { releaseLock = resolve; });
    const owner = client!.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('integration-lock'))`;
      locked();
      await release;
    });
    await acquired;
    const result = await contender.$transaction((tx) => tx.$queryRaw<Array<{ locked: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtext('integration-lock')) AS locked`);
    expect(result[0]?.locked).toBe(false);
    releaseLock();
    await owner;
    await client!.workerHeartbeat.upsert({
      where: { id: "primary" },
      create: { id: "primary", instanceId: "first", status: "HEALTHY", startedAt: new Date(), lastHeartbeatAt: new Date() },
      update: { instanceId: "first", status: "HEALTHY", startedAt: new Date(), lastHeartbeatAt: new Date() },
    });
    await client!.workerHeartbeat.update({ where: { id: "primary" }, data: { instanceId: "restarted", lastHeartbeatAt: new Date() } });
    expect((await client!.workerHeartbeat.findUniqueOrThrow({ where: { id: "primary" } })).instanceId).toBe("restarted");
    expect(await client!.order.count({ where: { id: "integration-order" } })).toBe(1);
    await contender.$disconnect();
  });
});
