CREATE TABLE "MarketAiAnalysis" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "price" DECIMAL(24,8) NOT NULL,
    "marketDataSource" TEXT NOT NULL,
    "marketSnapshot" JSONB NOT NULL,
    "result" JSONB,
    "promptVersion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "openAiResponseId" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostUsd" DECIMAL(18,8),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketAiAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketAiAnalysis_symbol_createdAt_idx" ON "MarketAiAnalysis"("symbol", "createdAt");
CREATE INDEX "MarketAiAnalysis_status_createdAt_idx" ON "MarketAiAnalysis"("status", "createdAt");
