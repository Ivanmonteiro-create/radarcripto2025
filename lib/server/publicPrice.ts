import { isSpotUsdtSymbol, normalizeSymbol } from "@/lib/trading/domain";

export async function getTestnetSpotPrice(symbolInput: string): Promise<number> {
  const symbol = normalizeSymbol(symbolInput);
  if (!isSpotUsdtSymbol(symbol)) throw new Error(`Invalid Spot symbol ${symbolInput}`);
  const response = await fetch(`https://testnet.binance.vision/api/v3/ticker/price?symbol=${symbol}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Testnet price request failed with ${response.status}`);
  const payload = await response.json() as { price?: string };
  const price = Number(payload.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error(`Invalid Testnet price for ${symbol}`);
  return price;
}
