CREATE TYPE "HealthState" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY');
ALTER TYPE "OrderStatus" ADD VALUE 'UNKNOWN';

ALTER TABLE "BalanceSnapshot" DROP CONSTRAINT "BalanceSnapshot_botId_fkey";
ALTER TABLE "BotConfig" DROP CONSTRAINT "BotConfig_exchangeAccountId_fkey";
ALTER TABLE "BotConfig" DROP CONSTRAINT "BotConfig_strategyId_fkey";
ALTER TABLE "BotConfig" DROP CONSTRAINT "BotConfig_userId_fkey";
ALTER TABLE "BotLog" DROP CONSTRAINT "BotLog_botId_fkey";
ALTER TABLE "BotRuntime" DROP CONSTRAINT "BotRuntime_botId_fkey";
ALTER TABLE "ExchangeAccount" DROP CONSTRAINT "ExchangeAccount_userId_fkey";
ALTER TABLE "Fill" DROP CONSTRAINT "Fill_botId_fkey";
ALTER TABLE "Fill" DROP CONSTRAINT "Fill_orderId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT "Order_botId_fkey";
ALTER TABLE "Position" DROP CONSTRAINT "Position_botId_fkey";
ALTER TABLE "RiskEvent" DROP CONSTRAINT "RiskEvent_botId_fkey";
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_botId_fkey";
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_orderId_fkey";

ALTER TABLE "ExchangeAccount"
  ADD COLUMN "apiKeyMask" TEXT,
  ADD COLUMN "credentialRotatedAt" TIMESTAMP(3),
  ADD COLUMN "lastValidatedAt" TIMESTAMP(3),
  ADD COLUMN "lastValidationError" TEXT;

ALTER TABLE "Fill"
  ADD COLUMN "feeAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
  ADD COLUMN "feeAsset" TEXT;

ALTER TABLE "Order"
  ADD COLUMN "exchangeUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "lastReconciledAt" TIMESTAMP(3),
  ADD COLUMN "lastReconciliationError" TEXT,
  ADD COLUMN "reconciliationAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "submissionUncertain" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Trade"
  ADD COLUMN "exchangeTradeId" TEXT,
  ADD COLUMN "feeAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
  ADD COLUMN "feeAsset" TEXT;

CREATE TABLE "SystemSetting" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "WorkerHeartbeat" (
  "id" TEXT NOT NULL DEFAULT 'primary',
  "instanceId" TEXT NOT NULL,
  "status" "HealthState" NOT NULL DEFAULT 'DEGRADED',
  "startedAt" TIMESTAMP(3) NOT NULL,
  "lastHeartbeatAt" TIMESTAMP(3) NOT NULL,
  "lastCycleStartedAt" TIMESTAMP(3),
  "lastCycleCompletedAt" TIMESTAMP(3),
  "lastReconciliationAt" TIMESTAMP(3),
  "lastError" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditEvent_event_createdAt_idx" ON "AuditEvent"("event", "createdAt");
CREATE UNIQUE INDEX "Trade_orderId_exchangeTradeId_key" ON "Trade"("orderId", "exchangeTradeId");

ALTER TABLE "ExchangeAccount" ADD CONSTRAINT "ExchangeAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BotConfig" ADD CONSTRAINT "BotConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BotConfig" ADD CONSTRAINT "BotConfig_exchangeAccountId_fkey" FOREIGN KEY ("exchangeAccountId") REFERENCES "ExchangeAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BotConfig" ADD CONSTRAINT "BotConfig_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BotRuntime" ADD CONSTRAINT "BotRuntime_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Position" ADD CONSTRAINT "Position_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BalanceSnapshot" ADD CONSTRAINT "BalanceSnapshot_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskEvent" ADD CONSTRAINT "RiskEvent_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BotLog" ADD CONSTRAINT "BotLog_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
