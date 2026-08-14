import { randomUUID } from "node:crypto";
import { getWorkerConfig } from "@/lib/server/env";
import { ExecutionService } from "@/lib/server/executionService";
import { prisma } from "@/lib/server/prisma";
import { redactSensitive } from "@/lib/server/redact";
import { finalizeStoppingTests, processTimedTests } from "@/lib/server/botTestService";

async function main() {
  const config = getWorkerConfig();
  if (!config.enabled) throw new Error("Worker refused to start because BOT_WORKER_ENABLED is not true");
  const service = new ExecutionService();
  const instanceId = randomUUID();
  const startedAt = new Date();
  let stopping = false;
  let consecutiveFailures = 0;
  const stop = () => { stopping = true; };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  await prisma.workerHeartbeat.upsert({
    where: { id: "primary" },
    create: { id: "primary", instanceId, status: "DEGRADED", startedAt, lastHeartbeatAt: new Date() },
    update: { instanceId, status: "DEGRADED", startedAt, lastHeartbeatAt: new Date(), lastError: null },
  });
  console.info(JSON.stringify({ level: "INFO", event: "WORKER_STARTED", instanceId }));

  while (!stopping) {
    const started = Date.now();
    try {
      await prisma.workerHeartbeat.update({
        where: { id: "primary" },
        data: { status: "HEALTHY", lastHeartbeatAt: new Date(), lastCycleStartedAt: new Date(), lastError: null },
      });
      await processTimedTests();
      await service.reconcileOpenOrders();
      await prisma.workerHeartbeat.update({ where: { id: "primary" }, data: { lastReconciliationAt: new Date() } });
      await finalizeStoppingTests();
      await service.runActiveBots();
      consecutiveFailures = 0;
      await prisma.workerHeartbeat.update({
        where: { id: "primary" },
        data: { status: "HEALTHY", lastHeartbeatAt: new Date(), lastCycleCompletedAt: new Date(), lastError: null },
      });
    } catch (error) {
      consecutiveFailures += 1;
      const message = redactSensitive(error instanceof Error ? error.message : "Worker cycle failed");
      console.error(JSON.stringify({ level: "ERROR", event: "WORKER_CYCLE_FAILED", attempt: consecutiveFailures, message }));
      await prisma.workerHeartbeat.update({
        where: { id: "primary" },
        data: { status: consecutiveFailures >= config.retryLimit ? "UNHEALTHY" : "DEGRADED", lastHeartbeatAt: new Date(), lastError: message },
      }).catch(() => undefined);
    }
    const backoff = consecutiveFailures
      ? Math.min(config.maxBackoffMs, config.pollMs * (2 ** Math.min(consecutiveFailures - 1, config.retryLimit - 1)))
      : config.pollMs;
    const remaining = Math.max(0, backoff - (Date.now() - started));
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  await prisma.workerHeartbeat.update({
    where: { id: "primary" }, data: { status: "DEGRADED", lastHeartbeatAt: new Date(), lastError: "Worker stopped gracefully" },
  }).catch(() => undefined);
  console.info(JSON.stringify({ level: "INFO", event: "WORKER_STOPPED", instanceId }));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(redactSensitive(error instanceof Error ? error.message : "Worker failed"));
  await prisma.$disconnect();
  process.exitCode = 1;
});
