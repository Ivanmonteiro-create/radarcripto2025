import { prisma } from "./prisma";

const INTERNAL_EMAIL = "internal@radarcrypto.local";

export async function ensureInternalUser() {
  return prisma.user.upsert({
    where: { email: INTERNAL_EMAIL },
    create: { email: INTERNAL_EMAIL, displayName: "RadarCrypto Internal" },
    update: {},
  });
}
