ALTER TABLE "Order"
  ADD COLUMN "decisionTelemetry" JSONB,
  ADD COLUMN "realisticFee" DECIMAL(24,8),
  ADD COLUMN "realisticSlippage" DECIMAL(24,8);

ALTER TABLE "Position"
  ADD COLUMN "realisticEntryFee" DECIMAL(24,8),
  ADD COLUMN "realisticEntrySlippage" DECIMAL(24,8);

ALTER TABLE "Trade"
  ADD COLUMN "realisticNetPnl" DECIMAL(24,8),
  ADD COLUMN "realisticFee" DECIMAL(24,8),
  ADD COLUMN "realisticSlippage" DECIMAL(24,8),
  ADD COLUMN "realisticFeeCost" DECIMAL(24,8),
  ADD COLUMN "realisticSlippageCost" DECIMAL(24,8),
  ADD COLUMN "totalRealisticCost" DECIMAL(24,8);

ALTER TABLE "BotTestRun"
  ADD COLUMN "realisticNetPnl" DECIMAL(24,8),
  ADD COLUMN "realisticFee" DECIMAL(24,8),
  ADD COLUMN "realisticSlippage" DECIMAL(24,8),
  ADD COLUMN "realisticTakerFeeBps" DECIMAL(14,6),
  ADD COLUMN "realisticSlippageBps" DECIMAL(14,6),
  ADD COLUMN "insufficientRealisticEdgeBlocks" INTEGER,
  ADD COLUMN "insufficient5mRangeBlocks" INTEGER,
  ADD COLUMN "insufficient15mRangeBlocks" INTEGER,
  ADD COLUMN "lastRange2mBps" DECIMAL(14,6),
  ADD COLUMN "lastRange5mBps" DECIMAL(14,6),
  ADD COLUMN "lastRange15mBps" DECIMAL(14,6),
  ADD COLUMN "lastMomentum2mBps" DECIMAL(14,6),
  ADD COLUMN "lastMomentum5mBps" DECIMAL(14,6),
  ADD COLUMN "lastMomentum15mBps" DECIMAL(14,6),
  ADD COLUMN "lastExpectedMoveA21Bps" DECIMAL(14,6);
