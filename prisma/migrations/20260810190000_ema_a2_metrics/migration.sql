ALTER TABLE "Position"
  ADD COLUMN "actualEntryFee" DECIMAL(24,8),
  ADD COLUMN "actualEntrySlippage" DECIMAL(24,8),
  ADD COLUMN "lowestPrice" DECIMAL(24,8),
  ADD COLUMN "highestPrice" DECIMAL(24,8),
  ADD COLUMN "maeQuote" DECIMAL(24,8),
  ADD COLUMN "maeBps" DECIMAL(14,6),
  ADD COLUMN "mfeQuote" DECIMAL(24,8),
  ADD COLUMN "mfeBps" DECIMAL(14,6),
  ADD COLUMN "maeAt" TIMESTAMP(3),
  ADD COLUMN "mfeAt" TIMESTAMP(3);

ALTER TABLE "Trade"
  ADD COLUMN "actualFeeCost" DECIMAL(24,8),
  ADD COLUMN "simulatedFeeCost" DECIMAL(24,8),
  ADD COLUMN "observedSlippageCost" DECIMAL(24,8),
  ADD COLUMN "simulatedSlippageCost" DECIMAL(24,8),
  ADD COLUMN "totalSimulatedCost" DECIMAL(24,8),
  ADD COLUMN "costAsPctOfGrossProfit" DECIMAL(14,6),
  ADD COLUMN "maeQuote" DECIMAL(24,8),
  ADD COLUMN "maeBps" DECIMAL(14,6),
  ADD COLUMN "mfeQuote" DECIMAL(24,8),
  ADD COLUMN "mfeBps" DECIMAL(14,6),
  ADD COLUMN "maeAt" TIMESTAMP(3),
  ADD COLUMN "mfeAt" TIMESTAMP(3),
  ADD COLUMN "exitEfficiencyPct" DECIMAL(14,6),
  ADD COLUMN "profitGivebackBps" DECIMAL(14,6);

ALTER TABLE "BotTestRun"
  ADD COLUMN "insufficientEdgeBlocks" INTEGER,
  ADD COLUMN "insufficientRangeBlocks" INTEGER,
  ADD COLUMN "microCrossoversFiltered" INTEGER,
  ADD COLUMN "lastExpectedMoveBps" DECIMAL(14,6),
  ADD COLUMN "lastRollingRangeBps" DECIMAL(14,6),
  ADD COLUMN "lastEmaSeparationBps" DECIMAL(14,6);
