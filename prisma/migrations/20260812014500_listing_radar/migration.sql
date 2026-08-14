CREATE TABLE "ListingSource" (
    "id" TEXT NOT NULL, "key" TEXT NOT NULL, "exchange" TEXT NOT NULL, "name" TEXT NOT NULL,
    "endpointUrl" TEXT NOT NULL, "homepageUrl" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3), "lastSuccessAt" TIMESTAMP(3), "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ListingSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ListingEvent" (
    "id" TEXT NOT NULL, "exchange" TEXT NOT NULL, "asset" TEXT NOT NULL, "symbol" TEXT NOT NULL,
    "title" TEXT NOT NULL, "normalizedTitle" TEXT NOT NULL, "type" TEXT NOT NULL, "status" TEXT NOT NULL,
    "confirmation" TEXT NOT NULL, "announcedAt" TIMESTAMP(3) NOT NULL, "tradingStartsAt" TIMESTAMP(3),
    "pairs" TEXT[], "network" TEXT, "alreadyTradingExchanges" TEXT[],
    "announcementPrice" DECIMAL(30,12), "currentPrice" DECIMAL(30,12), "volume24h" DECIMAL(30,8),
    "change24hPercent" DECIMAL(18,8), "changeSinceAnnouncement" DECIMAL(18,8), "marketUpdatedAt" TIMESTAMP(3),
    "aiStatus" TEXT NOT NULL DEFAULT 'PENDING', "aiErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ListingEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ListingEventSource" (
    "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "externalId" TEXT,
    "title" TEXT NOT NULL, "url" TEXT NOT NULL, "excerpt" TEXT, "publishedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingEventSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ListingMarket" (
    "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "exchange" TEXT NOT NULL, "pair" TEXT NOT NULL,
    "price" DECIMAL(30,12), "volume24h" DECIMAL(30,8), "change24hPercent" DECIMAL(18,8),
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingMarket_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ListingAiAnalysis" (
    "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "summary" TEXT NOT NULL, "explanation" TEXT NOT NULL,
    "impact" TEXT NOT NULL, "confidence" TEXT NOT NULL, "model" TEXT NOT NULL, "promptVersion" TEXT NOT NULL,
    "inputTokens" INTEGER, "outputTokens" INTEGER, "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingAiAnalysis_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ListingSource_key_key" ON "ListingSource"("key");
CREATE UNIQUE INDEX "ListingEvent_exchange_symbol_type_announcedAt_key" ON "ListingEvent"("exchange", "symbol", "type", "announcedAt");
CREATE INDEX "ListingEvent_announcedAt_idx" ON "ListingEvent"("announcedAt");
CREATE INDEX "ListingEvent_exchange_announcedAt_idx" ON "ListingEvent"("exchange", "announcedAt");
CREATE INDEX "ListingEvent_type_status_idx" ON "ListingEvent"("type", "status");
CREATE UNIQUE INDEX "ListingEventSource_url_key" ON "ListingEventSource"("url");
CREATE UNIQUE INDEX "ListingEventSource_eventId_sourceId_key" ON "ListingEventSource"("eventId", "sourceId");
CREATE INDEX "ListingEventSource_sourceId_publishedAt_idx" ON "ListingEventSource"("sourceId", "publishedAt");
CREATE UNIQUE INDEX "ListingMarket_eventId_exchange_pair_key" ON "ListingMarket"("eventId", "exchange", "pair");
CREATE INDEX "ListingMarket_eventId_idx" ON "ListingMarket"("eventId");
CREATE UNIQUE INDEX "ListingAiAnalysis_eventId_key" ON "ListingAiAnalysis"("eventId");
ALTER TABLE "ListingEventSource" ADD CONSTRAINT "ListingEventSource_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ListingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingEventSource" ADD CONSTRAINT "ListingEventSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ListingSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingMarket" ADD CONSTRAINT "ListingMarket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ListingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingAiAnalysis" ADD CONSTRAINT "ListingAiAnalysis_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ListingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
