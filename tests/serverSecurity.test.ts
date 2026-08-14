import { afterEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/server/encryption";
import { getTradingMode } from "@/lib/server/env";
import { redactSensitive } from "@/lib/server/redact";
import { createSessionValue, requireCsrf, verifySessionValue } from "@/lib/server/auth";
import { maskApiKey, validateCredentialFormat } from "@/lib/server/exchangeCredentials";

const originalMode = process.env.TRADING_MODE;
const originalKey = process.env.ENCRYPTION_KEY;
const originalAuthSecret = process.env.AUTH_SECRET;

afterEach(() => {
  if (originalMode === undefined) delete process.env.TRADING_MODE; else process.env.TRADING_MODE = originalMode;
  if (originalKey === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = originalKey;
  if (originalAuthSecret === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = originalAuthSecret;
});

describe("server security configuration", () => {
  it("defaults to SIM and rejects unknown trading modes", () => {
    delete process.env.TRADING_MODE;
    expect(getTradingMode()).toBe("SIM");
    process.env.TRADING_MODE = "LIVE";
    expect(() => getTradingMode()).toThrow(/SIM or TESTNET/);
  });

  it("encrypts exchange credentials with authenticated encryption", () => {
    process.env.ENCRYPTION_KEY = "11".repeat(32);
    const encrypted = encryptSecret("testnet-secret-value");
    expect(encrypted).not.toContain("testnet-secret-value");
    expect(decryptSecret(encrypted)).toBe("testnet-secret-value");
    const replacement = encrypted.endsWith("x") ? "y" : "x";
    expect(() => decryptSecret(`${encrypted.slice(0, -1)}${replacement}`)).toThrow();
  });

  it("redacts credentials and database passwords from logs", () => {
    const result = redactSensitive("api_secret=abc123 postgresql://user:pass@database.local/radar");
    expect(result).not.toContain("abc123");
    expect(result).not.toContain("user:pass");
    expect(result).toContain("[REDACTED]");
  });

  it("signs sessions, rejects expired sessions, and detects tampering", () => {
    process.env.AUTH_SECRET = "a".repeat(32);
    const valid = createSessionValue();
    expect(verifySessionValue(valid)).toBe(true);
    expect(verifySessionValue(`${valid}x`)).toBe(false);
    expect(verifySessionValue(createSessionValue(Date.now() - 9 * 60 * 60 * 1_000))).toBe(false);
  });

  it("requires the CSRF marker and rejects cross-site origins", () => {
    const valid = new Request("https://preview.example/api/bots", {
      method: "POST",
      headers: { "x-radarcrypto-csrf": "1", origin: "https://preview.example", "sec-fetch-site": "same-origin" },
    });
    const crossSite = new Request("https://preview.example/api/bots", {
      method: "POST",
      headers: { "x-radarcrypto-csrf": "1", origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
    });
    expect(requireCsrf(valid)).toBeNull();
    expect(requireCsrf(crossSite)?.status).toBe(403);
    expect(requireCsrf(new Request("https://preview.example/api/bots", { method: "POST" }))?.status).toBe(403);
  });

  it("validates Testnet credential shape and exposes only a mask", () => {
    const key = "A".repeat(64);
    expect(validateCredentialFormat(key)).toBe(true);
    expect(validateCredentialFormat("short")).toBe(false);
    expect(maskApiKey(key)).toBe("AAAA…AAAA");
    expect(maskApiKey(key)).not.toBe(key);
  });
});
