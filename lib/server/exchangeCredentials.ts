import { BinanceTestnetExchange, type BinanceReadOnlyValidation } from "@/lib/exchanges/BinanceTestnetExchange";
import { decryptSecret, encryptSecret } from "./encryption";
import { ensureInternalUser } from "./internalUser";
import { prisma } from "./prisma";
import { redactSensitive } from "./redact";

const ACCOUNT_NAME = "Binance Spot Testnet";

export function maskApiKey(apiKey: string): string {
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}

export function validateCredentialFormat(value: string): boolean {
  return /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

export async function saveAndValidateTestnetCredentials(apiKey: string, apiSecret: string, symbol: string) {
  const user = await ensureInternalUser();
  const account = await prisma.exchangeAccount.upsert({
    where: { userId_name: { userId: user.id, name: ACCOUNT_NAME } },
    create: {
      userId: user.id,
      name: ACCOUNT_NAME,
      mode: "TESTNET",
      encryptedApiKey: encryptSecret(apiKey),
      encryptedApiSecret: encryptSecret(apiSecret),
      apiKeyMask: maskApiKey(apiKey),
      credentialRotatedAt: new Date(),
      enabled: false,
    },
    update: {
      encryptedApiKey: encryptSecret(apiKey),
      encryptedApiSecret: encryptSecret(apiSecret),
      apiKeyMask: maskApiKey(apiKey),
      credentialRotatedAt: new Date(),
      lastValidatedAt: null,
      lastValidationError: null,
      enabled: false,
      encryptionKeyVersion: { increment: 1 },
    },
  });
  await prisma.auditEvent.create({
    data: { actor: "internal", event: "TESTNET_CREDENTIALS_ROTATED", metadata: { accountId: account.id } },
  });

  try {
    const validation = await validateConfig({ apiKey, apiSecret }, symbol);
    await prisma.exchangeAccount.update({
      where: { id: account.id },
      data: { enabled: true, lastValidatedAt: new Date(), lastValidationError: null },
    });
    await prisma.auditEvent.create({
      data: { actor: "internal", event: "TESTNET_CREDENTIALS_VALIDATED", metadata: { accountId: account.id, symbol } },
    });
    return { accountId: account.id, apiKeyMask: maskApiKey(apiKey), validation };
  } catch (error) {
    const message = redactSensitive(error instanceof Error ? error.message : "Testnet validation failed");
    await prisma.exchangeAccount.update({
      where: { id: account.id },
      data: { enabled: false, lastValidatedAt: new Date(), lastValidationError: message },
    });
    throw error;
  }
}

export async function validateStoredTestnetCredentials(symbol: string): Promise<BinanceReadOnlyValidation> {
  const account = await findEnabledTestnetAccount();
  if (!account?.encryptedApiKey || !account.encryptedApiSecret) throw new Error("Validated Testnet credentials are not configured");
  try {
    const result = await validateConfig({
      apiKey: decryptSecret(account.encryptedApiKey),
      apiSecret: decryptSecret(account.encryptedApiSecret),
    }, symbol);
    await prisma.exchangeAccount.update({ where: { id: account.id }, data: { lastValidatedAt: new Date(), lastValidationError: null } });
    return result;
  } catch (error) {
    const message = redactSensitive(error instanceof Error ? error.message : "Testnet validation failed");
    await prisma.exchangeAccount.update({ where: { id: account.id }, data: { enabled: false, lastValidatedAt: new Date(), lastValidationError: message } });
    throw error;
  }
}

export async function getStoredTestnetConfig(botId?: string): Promise<{ apiKey: string; apiSecret: string; baseUrl: string } | null> {
  const account = botId
    ? await prisma.exchangeAccount.findFirst({
        where: {
          mode: "TESTNET", enabled: true, encryptedApiKey: { not: null }, encryptedApiSecret: { not: null },
          OR: [{ bots: { some: { id: botId } } }, { user: { botConfigs: { some: { id: botId } } } }],
        },
        orderBy: { updatedAt: "desc" },
      })
    : await findEnabledTestnetAccount();
  if (!account?.encryptedApiKey || !account.encryptedApiSecret) return null;
  return {
    apiKey: decryptSecret(account.encryptedApiKey),
    apiSecret: decryptSecret(account.encryptedApiSecret),
    baseUrl: "https://testnet.binance.vision",
  };
}

export async function deleteTestnetCredentials(): Promise<boolean> {
  const user = await ensureInternalUser();
  const account = await prisma.exchangeAccount.findUnique({ where: { userId_name: { userId: user.id, name: ACCOUNT_NAME } } });
  if (!account) return false;
  await prisma.$transaction([
    prisma.botConfig.updateMany({ where: { exchangeAccountId: account.id, status: "RUNNING" }, data: { status: "PAUSED" } }),
    prisma.exchangeAccount.update({
      where: { id: account.id },
      data: { encryptedApiKey: null, encryptedApiSecret: null, apiKeyMask: null, enabled: false, lastValidationError: null },
    }),
    prisma.auditEvent.create({ data: { actor: "internal", event: "TESTNET_CREDENTIALS_DELETED", metadata: { accountId: account.id } } }),
  ]);
  return true;
}

export async function getTestnetCredentialSummary() {
  const account = await findEnabledTestnetAccount(true);
  if (!account) return { configured: false, enabled: false };
  return {
    configured: Boolean(account.encryptedApiKey && account.encryptedApiSecret),
    enabled: account.enabled,
    apiKeyMask: account.apiKeyMask,
    lastValidatedAt: account.lastValidatedAt,
    lastValidationError: account.lastValidationError,
    credentialRotatedAt: account.credentialRotatedAt,
  };
}

async function findEnabledTestnetAccount(includeDisabled = false) {
  const user = await ensureInternalUser();
  return prisma.exchangeAccount.findFirst({
    where: { userId: user.id, mode: "TESTNET", ...(includeDisabled ? {} : { enabled: true }) },
    orderBy: { updatedAt: "desc" },
  });
}

async function validateConfig(config: { apiKey: string; apiSecret: string }, symbol: string) {
  const exchange = new BinanceTestnetExchange({ ...config, baseUrl: "https://testnet.binance.vision" });
  return exchange.validateReadOnly(symbol);
}
