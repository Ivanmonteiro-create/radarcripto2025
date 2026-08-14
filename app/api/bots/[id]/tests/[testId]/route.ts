import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

type Context = { params: Promise<{ id: string; testId: string }> };

export async function GET(_request: Request, context: Context) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const { id, testId } = await context.params;
    const test = await prisma.botTestRun.findFirst({
      where: { id: testId, botId: id },
      include: {
        orders: { orderBy: { createdAt: "asc" }, include: { fills: true } },
        trades: { orderBy: { timestamp: "asc" } },
        riskEvents: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!test) throw new ApiError(404, "BOT_TEST_NOT_FOUND");
    return NextResponse.json({ ok: true, test });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
