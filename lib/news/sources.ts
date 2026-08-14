export type NewsSourceDefinition = {
  key: string;
  name: string;
  feedUrl: string;
  homepageUrl: string;
  tier: 1 | 2 | 3;
  confidence: "OFICIAL" | "ALTA CONFIANÇA" | "MÍDIA ESPECIALIZADA";
  allowedHosts: string[];
  includeAll: boolean;
};

export const NEWS_SOURCES: readonly NewsSourceDefinition[] = [
  {
    key: "federal-reserve",
    name: "Federal Reserve",
    feedUrl: "https://www.federalreserve.gov/feeds/press_all.xml",
    homepageUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
    tier: 1,
    confidence: "OFICIAL",
    allowedHosts: ["federalreserve.gov", "www.federalreserve.gov"],
    includeAll: false,
  },
  {
    key: "ethereum-foundation",
    name: "Ethereum Foundation Blog",
    feedUrl: "https://blog.ethereum.org/feed.xml",
    homepageUrl: "https://blog.ethereum.org/",
    tier: 1,
    confidence: "OFICIAL",
    allowedHosts: ["blog.ethereum.org", "ethereum.org"],
    includeAll: true,
  },
  {
    key: "coindesk",
    name: "CoinDesk",
    feedUrl: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    homepageUrl: "https://www.coindesk.com/",
    tier: 3,
    confidence: "MÍDIA ESPECIALIZADA",
    allowedHosts: ["coindesk.com", "www.coindesk.com"],
    includeAll: true,
  },
  {
    key: "cointelegraph",
    name: "Cointelegraph",
    feedUrl: "https://cointelegraph.com/rss",
    homepageUrl: "https://cointelegraph.com/",
    tier: 3,
    confidence: "MÍDIA ESPECIALIZADA",
    allowedHosts: ["cointelegraph.com", "www.cointelegraph.com"],
    includeAll: true,
  },
] as const;

export function isSafeNewsUrl(rawUrl: string, allowedHosts: readonly string[]): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" && allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
