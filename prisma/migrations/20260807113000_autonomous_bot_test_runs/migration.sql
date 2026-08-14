CREATE TYPE "BotTestStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'INTERRUPTED', 'ERROR');

CREATE TABLE "BotTestRun" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "status" "BotTestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "testStartedAt" TIMESTAMP(3) NOT NULL,
    "testEndsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "requestedDurationMs" INTEGER NOT NULL,
    "actualDurationMs" INTEGER,
    "stopRequestedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "stopReason" TEXT,
    "configuration" JSONB NOT NULL,
    "mode" "ExchangeMode" NOT NULL,
    "symbol" TEXT NOT NULL,
    "strategy" "StrategyKind" NOT NULL,
    "observations" INTEGER NOT NULL DEFAULT 0,
    "crossoverCount" INTEGER NOT NULL DEFAULT 0,
    "buySignals" INTEGER NOT NULL DEFAULT 0,
    "sellSignals" INTEGER NOT NULL DEFAULT 0,
    "holdSignals" INTEGER NOT NULL DEFAULT 0,
    "buyBlocked" INTEGER NOT NULL DEFAULT 0,
    "sellIgnored" INTEGER NOT NULL DEFAULT 0,
    "cooldownBlocks" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "initialEquity" DECIMAL(24,8) NOT NULL,
    "peakEquity" DECIMAL(24,8) NOT NULL,
    "finalEquity" DECIMAL(24,8),
    "realizedPnl" DECIMAL(24,8) NOT NULL DEFAULT 0,
    "unrealizedPnl" DECIMAL(24,8) NOT NULL DEFAULT 0,
    "finalPnl" DECIMAL(24,8),
    "currentDrawdownPct" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "maxDrawdownPct" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "lastSignal" TEXT,
    "lastError" TEXT,
    "lastHeartbeatAt" TIMESTAMP(3),
    "endedWithOpenPosition" BOOLEAN NOT NULL DEFAULT false,
    "finalPosition" JSONB,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotTestRun_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN "testRunId" TEXT;
ALTER TABLE "Fill" ADD COLUMN "testRunId" TEXT;
ALTER TABLE "Trade" ADD COLUMN "testRunId" TEXT;
ALTER TABLE "RiskEvent" ADD COLUMN "testRunId" TEXT;

CREATE INDEX "BotTestRun_botId_testStartedAt_idx" ON "BotTestRun"("botId", "testStartedAt");
CREATE INDEX "BotTestRun_status_testEndsAt_idx" ON "BotTestRun"("status", "testEndsAt");
CREATE UNIQUE INDEX "BotTestRun_one_active_per_bot_idx" ON "BotTestRun"("botId") WHERE "status" = 'IN_PROGRESS';
CREATE INDEX "Order_testRunId_createdAt_idx" ON "Order"("testRunId", "createdAt");
CREATE INDEX "Fill_testRunId_createdAt_idx" ON "Fill"("testRunId", "createdAt");
CREATE INDEX "Trade_testRunId_timestamp_idx" ON "Trade"("testRunId", "timestamp");
CREATE INDEX "RiskEvent_testRunId_createdAt_idx" ON "RiskEvent"("testRunId", "createdAt");

ALTER TABLE "BotTestRun" ADD CONSTRAINT "BotTestRun_botId_fkey"
    FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_testRunId_fkey"
    FOREIGN KEY ("testRunId") REFERENCES "BotTestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_testRunId_fkey"
    FOREIGN KEY ("testRunId") REFERENCES "BotTestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_testRunId_fkey"
    FOREIGN KEY ("testRunId") REFERENCES "BotTestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskEvent" ADD CONSTRAINT "RiskEvent_testRunId_fkey"
    FOREIGN KEY ("testRunId") REFERENCES "BotTestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
