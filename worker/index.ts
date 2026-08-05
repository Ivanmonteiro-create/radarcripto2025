import { getWorkerConfig } from "@/lib/server/env";
import { ExecutionService } from "@/lib/server/executionService";
import { prisma } from "@/lib/server/prisma";
import { redactSensitive } from "@/lib/server/redact";

async function main() {
  const config = getWorkerConfig();
  if (!config.enabled) throw new Error("Worker refused to start because BOT_WORKER_ENABLED is not true");
  const service = new ExecutionService();
  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  while (!stopping) {
    const started = Date.now();
    await service.runActiveBots();
    const remaining = Math.max(0, config.pollMs - (Date.now() - started));
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(redactSensitive(error instanceof Error ? error.message : "Worker failed"));
  await prisma.$disconnect();
  process.exitCode = 1;
});
