import { Prisma } from "@prisma/client";
import { getTradingMode } from "@/lib/server/env";
import { prisma } from "@/lib/server/prisma";
import { buildRangeAccountingView } from "@/lib/server/rangeAccountingView";

const args = new Set(process.argv.slice(2));
const configurationId = process.argv.find((argument) => argument.startsWith("--configuration="))?.split("=")[1];
const apply = args.has("--apply");
const previewConfirmed = args.has("--confirm-preview-testnet");
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

if (!configurationId) throw new Error("Pass --configuration=<StrategyConfig ID>");
if (getTradingMode() !== "TESTNET") throw new Error("Range accounting recomputation is restricted to TESTNET");
if (apply && !previewConfirmed) throw new Error("Apply requires --confirm-preview-testnet");

const include = {
  bot: { select: { mode: true } },
  levels: {
    include: {
      runtime: true,
      cycles: { include: { orders: { include: { fills: true } } }, orderBy: { cycleNumber: "asc" as const } },
    },
    orderBy: { levelNumber: "asc" as const },
  },
};

type LoadedConfiguration = NonNullable<Awaited<ReturnType<typeof loadConfiguration>>>;
async function loadConfiguration(client: Prisma.TransactionClient | typeof prisma) {
  return client.strategyConfig.findUnique({ where: { id: configurationId }, include });
}

function plan(configuration: LoadedConfiguration) {
  if (configuration.bot.mode !== "TESTNET") throw new Error("Configuration bot is not TESTNET");
  const view = buildRangeAccountingView(configuration, null);
  const cycles = configuration.levels.flatMap((level) => level.cycles)
    .filter((cycle) => cycle.status === "COMPLETED")
    .map((cycle) => {
      const corrected = view.cycles[cycle.id];
      if (!corrected) throw new Error(`Completed cycle ${cycle.id} is not reproducible from fills`);
      return {
        id: cycle.id,
        levelId: cycle.levelId,
        cycleNumber: cycle.cycleNumber,
        oldNetPnl: Number(cycle.netPnl),
        correctedGrossPnl: corrected.realizedGrossPnl,
        correctedFees: corrected.realFees,
        observedSlippage: corrected.observedSlippage,
        correctedNetPnl: corrected.realizedNetPnl,
        difference: corrected.realizedNetPnl - Number(cycle.netPnl),
      };
    });
  const affected = cycles.filter((cycle) => Math.abs(cycle.difference) > 1e-10);
  return {
    view,
    cycles,
    affected,
    oldTotal: cycles.reduce((total, cycle) => total + cycle.oldNetPnl, 0),
    correctedTotal: cycles.reduce((total, cycle) => total + cycle.correctedNetPnl, 0),
  };
}

async function main() {
  const initial = await loadConfiguration(prisma);
  if (!initial) throw new Error("Strategy configuration not found");
  const dryRun = plan(initial);
  if (!apply) {
    console.log(JSON.stringify({
      mode: "DRY_RUN",
      configurationId,
      version: initial.version,
      completedCycles: dryRun.cycles.length,
      affectedCycles: dryRun.affected,
      oldTotal: dryRun.oldTotal,
      correctedTotal: dryRun.correctedTotal,
      difference: dryRun.correctedTotal - dryRun.oldTotal,
    }));
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${initial.botId})) IS NULL AS locked`;
    const current = await loadConfiguration(tx);
    if (!current || current.botId !== initial.botId || current.bot.mode !== "TESTNET") throw new Error("Configuration changed before recomputation");
    const recomputation = plan(current);
    for (const cycle of recomputation.cycles) {
      await tx.strategyCycle.update({ where: { id: cycle.id }, data: {
        grossPnl: cycle.correctedGrossPnl,
        fees: cycle.correctedFees,
        slippage: cycle.observedSlippage,
        netPnl: cycle.correctedNetPnl,
      } });
    }
    for (const level of current.levels) {
      const completed = recomputation.cycles.filter((cycle) => cycle.levelId === level.id);
      const netValues = completed.map((cycle) => cycle.correctedNetPnl);
      await tx.strategyLevelRuntime.update({ where: { levelId: level.id }, data: {
        grossPnl: completed.reduce((total, cycle) => total + cycle.correctedGrossPnl, 0),
        fees: completed.reduce((total, cycle) => total + cycle.correctedFees, 0),
        slippage: completed.reduce((total, cycle) => total + cycle.observedSlippage, 0),
        netPnl: completed.reduce((total, cycle) => total + cycle.correctedNetPnl, 0),
        completedCycles: completed.length,
        bestCyclePnl: netValues.length ? Math.max(...netValues) : null,
        worstCyclePnl: netValues.length ? Math.min(...netValues) : null,
      } });
    }
    await tx.auditEvent.create({ data: {
      actor: "internal-accounting-recompute",
      event: "RANGE_ACCOUNTING_RECOMPUTED",
      metadata: json({
        environment: "PREVIEW_TESTNET",
        configurationId,
        version: current.version,
        affectedCycles: recomputation.affected,
        oldTotal: recomputation.oldTotal,
        correctedTotal: recomputation.correctedTotal,
        difference: recomputation.correctedTotal - recomputation.oldTotal,
      }),
    } });
    return recomputation;
  }, { maxWait: 10_000, timeout: 60_000 });

  console.log(JSON.stringify({
    mode: "APPLIED_PREVIEW_TESTNET",
    configurationId,
    completedCycles: result.cycles.length,
    affectedCycles: result.affected.length,
    oldTotal: result.oldTotal,
    correctedTotal: result.correctedTotal,
    difference: result.correctedTotal - result.oldTotal,
    botStateChanged: false,
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }));
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
