CREATE TABLE "NewsSource" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "homepageUrl" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NewsSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "excerpt" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assets" TEXT[],
    "category" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsEvent" (
    "id" TEXT NOT NULL,
    "canonicalTitle" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assets" TEXT[],
    "firstPublishedAt" TIMESTAMP(3) NOT NULL,
    "lastPublishedAt" TIMESTAMP(3) NOT NULL,
    "sourceCount" INTEGER NOT NULL DEFAULT 1,
    "sourceConfidence" TEXT NOT NULL,
    "normalizedSummary" TEXT,
    "aiStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "aiErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NewsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsEventSource" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsEventSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsAiAnalysis" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "affectedAssets" TEXT[],
    "impact" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsAiAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsSource_key_key" ON "NewsSource"("key");
CREATE UNIQUE INDEX "NewsItem_url_key" ON "NewsItem"("url");
CREATE INDEX "NewsItem_sourceId_publishedAt_idx" ON "NewsItem"("sourceId", "publishedAt");
CREATE INDEX "NewsItem_contentHash_idx" ON "NewsItem"("contentHash");
CREATE INDEX "NewsEvent_lastPublishedAt_idx" ON "NewsEvent"("lastPublishedAt");
CREATE INDEX "NewsEvent_category_lastPublishedAt_idx" ON "NewsEvent"("category", "lastPublishedAt");
CREATE UNIQUE INDEX "NewsEventSource_itemId_key" ON "NewsEventSource"("itemId");
CREATE UNIQUE INDEX "NewsEventSource_eventId_itemId_key" ON "NewsEventSource"("eventId", "itemId");
CREATE INDEX "NewsEventSource_eventId_idx" ON "NewsEventSource"("eventId");
CREATE UNIQUE INDEX "NewsAiAnalysis_eventId_key" ON "NewsAiAnalysis"("eventId");

ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsEventSource" ADD CONSTRAINT "NewsEventSource_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NewsEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsEventSource" ADD CONSTRAINT "NewsEventSource_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "NewsItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsAiAnalysis" ADD CONSTRAINT "NewsAiAnalysis_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NewsEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
