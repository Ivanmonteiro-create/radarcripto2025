ALTER TABLE "MarketAiAnalysis" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'pt';

CREATE TABLE "ContentTranslation" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "totalTokens" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTranslation_entityType_entityId_locale_key" ON "ContentTranslation"("entityType", "entityId", "locale");
CREATE INDEX "ContentTranslation_entityType_locale_updatedAt_idx" ON "ContentTranslation"("entityType", "locale", "updatedAt");
