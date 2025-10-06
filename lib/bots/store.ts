// lib/bots/store.ts
import { BotConfig, BotRuntime } from "./types";

const K_CFG = "rc.bots.config";
const K_RUN = "rc.bots.runtime";

export function loadConfigs(): BotConfig[] {
  try { return JSON.parse(localStorage.getItem(K_CFG) || "[]"); } catch { return []; }
}
export function saveConfigs(cfgs: BotConfig[]) {
  localStorage.setItem(K_CFG, JSON.stringify(cfgs));
}

export function upsertConfig(cfg: BotConfig) {
  const all = loadConfigs();
  const i = all.findIndex(b => b.id === cfg.id);
  if (i >= 0) all[i] = cfg; else all.push(cfg);
  saveConfigs(all);
}

export function removeConfig(id: string) {
  saveConfigs(loadConfigs().filter(b => b.id !== id));
}

export function loadRuntime(): Record<string, BotRuntime> {
  try { return JSON.parse(localStorage.getItem(K_RUN) || "{}"); } catch { return {}; }
}
export function saveRuntime(rt: Record<string, BotRuntime>) {
  localStorage.setItem(K_RUN, JSON.stringify(rt));
}
