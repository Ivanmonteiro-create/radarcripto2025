ALTER TABLE "Order"
  ADD COLUMN "decisionPrice" DECIMAL(24,8),
  ADD COLUMN "decisionReason" TEXT,
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "firstFillAt" TIMESTAMP(3),
  ADD COLUMN "slippageQuote" DECIMAL(24,8),
  ADD COLUMN "slippageBps" DECIMAL(14,6),
  ADD COLUMN "exchangeFeeActual" DECIMAL(24,8),
  ADD COLUMN "simulatedFee" DECIMAL(24,8),
  ADD COLUMN "simulatedSlippage" DECIMAL(24,8);

ALTER TABLE "Position"
  ADD COLUMN "decisionCostBasisQuote" DECIMAL(24,8),
  ADD COLUMN "simulatedEntryFee" DECIMAL(24,8),
  ADD COLUMN "simulatedEntrySlippage" DECIMAL(24,8);

ALTER TABLE "Trade"
  ADD COLUMN "grossPnl" DECIMAL(24,8),
  ADD COLUMN "actualNetPnl" DECIMAL(24,8),
  ADD COLUMN "simulatedNetPnl" DECIMAL(24,8),
  ADD COLUMN "exchangeFeeActual" DECIMAL(24,8),
  ADD COLUMN "simulatedFee" DECIMAL(24,8),
  ADD COLUMN "actualSlippage" DECIMAL(24,8),
  ADD COLUMN "simulatedSlippage" DECIMAL(24,8);

ALTER TABLE "BalanceSnapshot"
  ADD COLUMN "testRunId" TEXT,
  ADD COLUMN "reason" TEXT NOT NULL DEFAULT 'PERIODIC';

ALTER TABLE "BotTestRun"
  ADD COLUMN "currentEquity" DECIMAL(24,8),
  ADD COLUMN "grossPnl" DECIMAL(24,8),
  ADD COLUMN "actualNetPnl" DECIMAL(24,8),
  ADD COLUMN "simulatedNetPnl" DECIMAL(24,8),
  ADD COLUMN "exchangeFeeActual" DECIMAL(24,8),
  ADD COLUMN "simulatedFee" DECIMAL(24,8),
  ADD COLUMN "actualSlippage" DECIMAL(24,8),
  ADD COLUMN "simulatedSlippage" DECIMAL(24,8),
  ADD COLUMN "costModelEnabled" BOOLEAN,
  ADD COLUMN "simulatedMakerFeeBps" DECIMAL(14,6),
  ADD COLUMN "simulatedTakerFeeBps" DECIMAL(14,6),
  ADD COLUMN "simulatedSlippageBps" DECIMAL(14,6);

ALTER TABLE "BalanceSnapshot"
  ADD CONSTRAINT "BalanceSnapshot_testRunId_fkey"
  FOREIGN KEY ("testRunId") REFERENCES "BotTestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

CREATE INDEX "BalanceSnapshot_testRunId_timestamp_idx"
  ON "BalanceSnapshot"("testRunId", "timestamp")
  WHERE "testRunId" IS NOT NULL;
