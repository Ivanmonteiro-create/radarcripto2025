import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { finalizeTestRun, requestTimedTestStop } from "@/lib/server/botTestService";
import { prisma } from "@/lib/server/prisma";
import { botTestStopSchema } from "@/lib/server/schemas";

type Context = { params: Promise<{ id: string; testId: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  try {
    await parseJson(request, botTestStopSchema);
    const { id, testId } = await context.params;
    const test = await prisma.botTestRun.findFirst({ where: { id: testId, botId: id, status: "IN_PROGRESS" } });
    if (!test) throw new ApiError(404, "ACTIVE_BOT_TEST_NOT_FOUND");
    await requestTimedTestStop(id, "OPERATOR_STOPPED");
    const finalized = await finalizeTestRun(testId);
    return NextResponse.json({ ok: true, test: finalized });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
