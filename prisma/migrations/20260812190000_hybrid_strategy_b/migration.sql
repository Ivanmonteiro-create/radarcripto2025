ALTER TYPE "StrategyKind" ADD VALUE 'RANGE_CYCLE';

CREATE TYPE "StrategyConfigMode" AS ENUM ('READY', 'CUSTOM');
CREATE TYPE "StrategyConfigStatus" AS ENUM ('DRAFT', 'VALIDATED', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "StrategyLevelState" AS ENUM ('WAITING_BUY', 'BUY_PENDING', 'WAITING_SELL', 'SELL_PENDING', 'COMPLETED', 'STOPPED', 'ERROR');
CREATE TYPE "StrategyCycleStatus" AS ENUM ('BUY_PENDING', 'HOLDING', 'SELL_PENDING', 'COMPLETED', 'STOPPED', 'ERROR');

CREATE TABLE "StrategyConfig" (
  "id" TEXT NOT NULL, "botId" TEXT NOT NULL, "ownerUserId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "mode" "StrategyConfigMode" NOT NULL, "status" "StrategyConfigStatus" NOT NULL DEFAULT 'DRAFT',
  "name" TEXT NOT NULL, "symbol" TEXT NOT NULL, "capitalTotal" DECIMAL(24,8) NOT NULL,
  "maxCommitted" DECIMAL(24,8) NOT NULL, "maxExposure" DECIMAL(24,8) NOT NULL,
  "structuralStop" DECIMAL(24,8) NOT NULL, "simulatedMakerFeeBps" DECIMAL(14,6) NOT NULL DEFAULT 10,
  "simulatedSlippageBps" DECIMAL(14,6) NOT NULL DEFAULT 5, "costWarningAccepted" BOOLEAN NOT NULL DEFAULT false,
  "validationSnapshot" JSONB, "validatedAt" TIMESTAMP(3), "activatedAt" TIMESTAMP(3), "archivedAt" TIMESTAMP(3),
  "isCurrent" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StrategyConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StrategyLevel" (
  "id" TEXT NOT NULL, "strategyConfigId" TEXT NOT NULL, "levelNumber" INTEGER NOT NULL,
  "entryPrice" DECIMAL(24,8) NOT NULL, "targetPrice" DECIMAL(24,8) NOT NULL, "quoteAmount" DECIMAL(24,8) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true, "repeat" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StrategyLevel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StrategyLevelRuntime" (
  "id" TEXT NOT NULL, "levelId" TEXT NOT NULL, "state" "StrategyLevelState" NOT NULL DEFAULT 'WAITING_BUY',
  "activeCycleId" TEXT, "activeOrderId" TEXT, "heldQuantity" DECIMAL(36,18) NOT NULL DEFAULT 0,
  "committedQuote" DECIMAL(24,8) NOT NULL DEFAULT 0, "completedCycles" INTEGER NOT NULL DEFAULT 0,
  "buys" INTEGER NOT NULL DEFAULT 0, "sells" INTEGER NOT NULL DEFAULT 0, "grossPnl" DECIMAL(24,8) NOT NULL DEFAULT 0,
  "fees" DECIMAL(24,8) NOT NULL DEFAULT 0, "slippage" DECIMAL(24,8) NOT NULL DEFAULT 0,
  "netPnl" DECIMAL(24,8) NOT NULL DEFAULT 0, "totalHoldingMs" BIGINT NOT NULL DEFAULT 0,
  "bestCyclePnl" DECIMAL(24,8), "worstCyclePnl" DECIMAL(24,8), "stopTriggeredCount" INTEGER NOT NULL DEFAULT 0,
  "lastTransitionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StrategyLevelRuntime_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StrategyCycle" (
  "id" TEXT NOT NULL, "strategyConfigId" TEXT NOT NULL, "levelId" TEXT NOT NULL, "cycleNumber" INTEGER NOT NULL,
  "status" "StrategyCycleStatus" NOT NULL, "entryLimitPrice" DECIMAL(24,8) NOT NULL,
  "targetLimitPrice" DECIMAL(24,8) NOT NULL, "quoteAmount" DECIMAL(24,8) NOT NULL,
  "filledQuantity" DECIMAL(36,18) NOT NULL DEFAULT 0, "averageBuyPrice" DECIMAL(24,8), "averageSellPrice" DECIMAL(24,8),
  "grossPnl" DECIMAL(24,8) NOT NULL DEFAULT 0, "fees" DECIMAL(24,8) NOT NULL DEFAULT 0,
  "slippage" DECIMAL(24,8) NOT NULL DEFAULT 0, "netPnl" DECIMAL(24,8) NOT NULL DEFAULT 0,
  "stopTriggered" BOOLEAN NOT NULL DEFAULT false, "openedAt" TIMESTAMP(3), "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StrategyCycle_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN "strategyCycleId" TEXT;

CREATE UNIQUE INDEX "StrategyConfig_botId_version_key" ON "StrategyConfig"("botId", "version");
CREATE INDEX "StrategyConfig_botId_isCurrent_idx" ON "StrategyConfig"("botId", "isCurrent");
CREATE INDEX "StrategyConfig_ownerUserId_createdAt_idx" ON "StrategyConfig"("ownerUserId", "createdAt");
CREATE UNIQUE INDEX "StrategyLevel_strategyConfigId_levelNumber_key" ON "StrategyLevel"("strategyConfigId", "levelNumber");
CREATE INDEX "StrategyLevel_strategyConfigId_enabled_idx" ON "StrategyLevel"("strategyConfigId", "enabled");
CREATE UNIQUE INDEX "StrategyLevelRuntime_levelId_key" ON "StrategyLevelRuntime"("levelId");
CREATE INDEX "StrategyLevelRuntime_state_updatedAt_idx" ON "StrategyLevelRuntime"("state", "updatedAt");
CREATE UNIQUE INDEX "StrategyCycle_levelId_cycleNumber_key" ON "StrategyCycle"("levelId", "cycleNumber");
CREATE INDEX "StrategyCycle_strategyConfigId_status_idx" ON "StrategyCycle"("strategyConfigId", "status");
CREATE INDEX "Order_strategyCycleId_createdAt_idx" ON "Order"("strategyCycleId", "createdAt");

ALTER TABLE "StrategyConfig" ADD CONSTRAINT "StrategyConfig_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyConfig" ADD CONSTRAINT "StrategyConfig_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyLevel" ADD CONSTRAINT "StrategyLevel_strategyConfigId_fkey" FOREIGN KEY ("strategyConfigId") REFERENCES "StrategyConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyLevelRuntime" ADD CONSTRAINT "StrategyLevelRuntime_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "StrategyLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyCycle" ADD CONSTRAINT "StrategyCycle_strategyConfigId_fkey" FOREIGN KEY ("strategyConfigId") REFERENCES "StrategyConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyCycle" ADD CONSTRAINT "StrategyCycle_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "StrategyLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_strategyCycleId_fkey" FOREIGN KEY ("strategyCycleId") REFERENCES "StrategyCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
