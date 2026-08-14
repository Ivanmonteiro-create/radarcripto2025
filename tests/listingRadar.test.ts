import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { fetchListingAnnouncements, ListingSourceError } from "@/lib/listings/announcementCollector";
import { listingRefreshSchema } from "@/lib/listings/contracts";
import { classifyListingType, deriveListingStatus, extractAsset, extractPairs, normalizeListingTitle, parseTradingStart } from "@/lib/listings/normalize";
import { fetchPublicMarkets, PUBLIC_MARKET_PROVIDERS } from "@/lib/listings/publicMarkets";
import { evaluateListingsRefresh } from "@/lib/listings/refreshPolicy";
import { LISTING_SOURCES } from "@/lib/listings/sources";

describe("listing announcement collection", () => {
  it("normalizes official KuCoin listing and delisting announcements", async () => {
    const payload = { code: "200000", data: { items: [
      { annId: 1, annTitle: "DAPPOS (DOS) Listed on KuCoin", annType: ["new-listings"], annDesc: "Trading: 12:00 on August 11, 2026 (UTC)", annUrl: "https://www.kucoin.com/announcement/en-dos", cTime: 1786436100000 },
      { annId: 2, annTitle: "KuCoin Will Delist ABC (ABC)", annType: ["delistings"], annDesc: "", annUrl: "https://www.kucoin.com/announcement/en-abc", cTime: 1786524660000 },
    ] } };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }));
    const items = await fetchListingAnnouncements(LISTING_SOURCES[0], fetchImpl as typeof fetch);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ exchange: "KUCOIN", asset: "DOS", type: "NEW_LISTING" });
    expect(items[0].tradingStartsAt?.toISOString()).toBe("2026-08-11T12:00:00.000Z");
    expect(items[1]).toMatchObject({ asset: "ABC", type: "DELISTING" });
  });

  it("normalizes official Bybit announcements and rejects unsafe source URLs", async () => {
    const payload = { retCode: 0, result: { list: [{ title: "New Listing: XYZUSDT on Bybit", description: "Spot listing", type: { key: "new_crypto", title: "New Listings" }, tags: ["Spot"], url: "https://announcements.bybit.com/en-US/article/xyz/", publishTime: 1786524000000 }] } };
    const items = await fetchListingAnnouncements(LISTING_SOURCES[1], vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch);
    expect(items[0]).toMatchObject({ exchange: "BYBIT", asset: "XYZ", symbol: "XYZUSDT" });
    const unsafe = { ...payload, result: { list: [{ ...payload.result.list[0], url: "https://evil.example/listing" }] } };
    await expect(fetchListingAnnouncements(LISTING_SOURCES[1], vi.fn(async () => new Response(JSON.stringify(unsafe), { status: 200 })) as typeof fetch)).resolves.toEqual([]);
  });

  it("isolates an unavailable official source", async () => {
    await expect(fetchListingAnnouncements(LISTING_SOURCES[0], vi.fn(async () => new Response("down", { status: 503 })) as typeof fetch)).rejects.toMatchObject({ code: "SOURCE_UNAVAILABLE" } satisfies Partial<ListingSourceError>);
  });
});

describe("listing classification, status and markets", () => {
  it("classifies supported event types deterministically", () => {
    expect(classifyListingType("New listing: XYZUSDT")).toBe("NEW_LISTING");
    expect(classifyListingType("Exchange will delist XYZ")).toBe("DELISTING");
    expect(classifyListingType("Adds XYZ/USDT trading pair")).toBe("NEW_TRADING_PAIR");
    expect(classifyListingType("XYZ pre-market trading")).toBe("PRE_MARKET");
    expect(extractPairs("XYZ/USDT and XYZ-BTC")).toEqual(["XYZUSDT", "XYZBTC"]);
    expect(extractAsset("Asset (XYZ) listed", [])).toBe("XYZ");
    expect(normalizeListingTitle("New Listing: XYZ/USDT!")).toBe("new listing xyz usdt");
  });

  it("derives timeline status without implying trading activity", () => {
    const now = new Date("2026-08-12T12:00:00Z");
    expect(deriveListingStatus("NEW_LISTING", new Date("2026-08-12T14:00:00Z"), now)).toBe("UPCOMING");
    expect(deriveListingStatus("NEW_LISTING", new Date("2026-08-12T10:00:00Z"), now)).toBe("LIVE");
    expect(deriveListingStatus("DELISTING", new Date("2026-08-13T10:00:00Z"), now)).toBe("DELISTING_SCHEDULED");
    expect(parseTradingStart("Trading: 12:00 on August 11, 2026 (UTC)")?.toISOString()).toBe("2026-08-11T12:00:00.000Z");
  });

  it("uses only public market endpoints for price, volume and market availability", async () => {
    const binance = PUBLIC_MARKET_PROVIDERS[0];
    const fetchImpl = vi.fn(async (url: string | URL | Request) => new Response(String(url).includes("binance") ? JSON.stringify([{ symbol: "XYZUSDT", lastPrice: "2", quoteVolume: "10000", priceChangePercent: "4" }]) : JSON.stringify([]), { status: 200 }));
    const result = await fetchPublicMarkets(["XYZ"], fetchImpl as typeof fetch);
    expect(result.markets).toContainEqual({ exchange: binance.exchange, pair: "XYZUSDT", asset: "XYZ", price: 2, volume24h: 10000, change24hPercent: 4 });
  });
});

describe("listing module controls and safety", () => {
  it("limits only manual collection and explicitly forbids AI during refresh", () => {
    const now = new Date("2026-08-12T12:00:00Z");
    expect(evaluateListingsRefresh({ now, lastFetchedAt: new Date("2026-08-12T11:50:00Z"), refreshMinutes: 30 }).allowed).toBe(false);
    expect(evaluateListingsRefresh({ now, lastFetchedAt: new Date("2026-08-12T11:20:00Z"), refreshMinutes: 30 }).allowed).toBe(true);
    expect(listingRefreshSchema.parse({})).toEqual({ analyzeWithAi: false });
    expect(listingRefreshSchema.safeParse({ analyzeWithAi: true }).success).toBe(false);
  });

  it("keeps collection, optional AI and trading execution strictly separated", async () => {
    const [refresh, analyze, service, client] = await Promise.all([readFile("app/api/listagens/refresh/route.ts", "utf8"), readFile("app/api/listagens/analyze/route.ts", "utf8"), readFile("lib/listings/listingService.ts", "utf8"), readFile("components/listings/ListingRadarClient.tsx", "utf8")]);
    expect(refresh).toContain("requireMutationAuth");
    expect(refresh).not.toMatch(/openai|analyzePendingListingEvents/i);
    expect(analyze).toContain("analyzePendingListingEvents");
    expect(`${refresh}\n${analyze}\n${service}`).not.toMatch(/placeOrder|cancelOrder|executionService|manualTestnet|exchangeFactory/);
    expect(client).toContain("JSON.stringify({ analyzeWithAi: false })");
    expect(client).toContain('t("listings.refresh")');
    expect(client).toContain('t("listings.analyze")');
  });

  it("provides persistence, filters, authentication and responsive UI", async () => {
    const [schema, api, css] = await Promise.all([readFile("prisma/schema.prisma", "utf8"), readFile("app/api/listagens/events/route.ts", "utf8"), readFile("app/globals.css", "utf8")]);
    for (const model of ["ListingSource", "ListingEvent", "ListingMarket", "ListingEventSource", "ListingAiAnalysis"]) expect(schema).toContain(`model ${model}`);
    expect(api).toContain("requireApiAuth");
    expect(api).toContain("listingConfirmationSchema");
    expect(css).toContain(".rc-listings-page");
    expect(css).toContain("@media (max-width: 560px)");
  });
});
