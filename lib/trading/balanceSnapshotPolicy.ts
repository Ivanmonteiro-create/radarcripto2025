import type { AccountBalance } from "./domain";

export type SnapshotBalance = Pick<AccountBalance, "asset" | "free" | "locked">;

export function relevantAssets(symbol: string, quoteAsset = "USDT"): [string, string] {
  if (!symbol.endsWith(quoteAsset) || symbol.length <= quoteAsset.length) throw new Error("Symbol does not match quote asset");
  return [symbol.slice(0, -quoteAsset.length), quoteAsset];
}

export function selectRelevantBalances(balances: SnapshotBalance[], symbol: string, quoteAsset = "USDT"): SnapshotBalance[] {
  const assets = relevantAssets(symbol, quoteAsset);
  const byAsset = new Map(balances.map((balance) => [balance.asset, balance]));
  return assets.map((asset) => byAsset.get(asset) ?? { asset, free: 0, locked: 0 });
}

export function intervalElapsed(lastTimestamp: Date | null | undefined, now: Date, intervalSec: number): boolean {
  return !lastTimestamp || now.getTime() - lastTimestamp.getTime() >= intervalSec * 1_000;
}

export function balancesEqual(left: SnapshotBalance[], right: SnapshotBalance[]): boolean {
  if (left.length !== right.length) return false;
  const normalized = (rows: SnapshotBalance[]) => [...rows].sort((a, b) => a.asset.localeCompare(b.asset));
  return normalized(left).every((row, index) => {
    const other = normalized(right)[index];
    return row.asset === other.asset && row.free === other.free && row.locked === other.locked;
  });
}

export function shouldPersistSnapshot(input: {
  reason: string;
  intervalHasElapsed: boolean;
  balancesChanged: boolean;
  hasPrevious: boolean;
}): boolean {
  if (!input.hasPrevious) return true;
  if (input.reason === "PERIODIC") return input.intervalHasElapsed;
  return input.intervalHasElapsed || input.balancesChanged;
}

export function retentionCutoff(retentionDays: number, now = new Date()): Date {
  return new Date(now.getTime() - retentionDays * 86_400_000);
}
