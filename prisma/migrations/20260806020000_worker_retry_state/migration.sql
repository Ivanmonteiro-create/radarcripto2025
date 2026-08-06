ALTER TABLE "BotRuntime"
  ADD COLUMN "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN "lastSuccessAt" TIMESTAMP(3);
