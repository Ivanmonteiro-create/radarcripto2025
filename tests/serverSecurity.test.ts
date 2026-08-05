import { afterEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/server/encryption";
import { getTradingMode } from "@/lib/server/env";
import { redactSensitive } from "@/lib/server/redact";

const originalMode = process.env.TRADING_MODE;
const originalKey = process.env.ENCRYPTION_KEY;

afterEach(() => {
  if (originalMode === undefined) delete process.env.TRADING_MODE; else process.env.TRADING_MODE = originalMode;
  if (originalKey === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = originalKey;
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
    expect(() => decryptSecret(`${encrypted.slice(0, -1)}x`)).toThrow();
  });

  it("redacts credentials and database passwords from logs", () => {
    const result = redactSensitive("api_secret=abc123 postgresql://user:pass@database.local/radar");
    expect(result).not.toContain("abc123");
    expect(result).not.toContain("user:pass");
    expect(result).toContain("[REDACTED]");
  });
});
