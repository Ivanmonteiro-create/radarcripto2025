export type ListingSourceDefinition = {
  key: "kucoin-announcements" | "bybit-announcements";
  exchange: "KUCOIN" | "BYBIT";
  name: string;
  endpointUrl: string;
  homepageUrl: string;
  allowedHosts: string[];
};

export const LISTING_SOURCES: readonly ListingSourceDefinition[] = [
  {
    key: "kucoin-announcements",
    exchange: "KUCOIN",
    name: "KuCoin Announcements API",
    endpointUrl: "https://api.kucoin.com/api/v3/announcements?currentPage=1&pageSize=50&annType=latest-announcements&lang=en_US",
    homepageUrl: "https://www.kucoin.com/announcement",
    allowedHosts: ["kucoin.com", "www.kucoin.com"],
  },
  {
    key: "bybit-announcements",
    exchange: "BYBIT",
    name: "Bybit Announcements API",
    endpointUrl: "https://api.bybit.com/v5/announcements/index?locale=en-US&limit=50",
    homepageUrl: "https://announcements.bybit.com/en-US/",
    allowedHosts: ["announcements.bybit.com", "bybit.com", "www.bybit.com"],
  },
] as const;

export function isSafeListingUrl(raw: string, hosts: readonly string[]) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}
