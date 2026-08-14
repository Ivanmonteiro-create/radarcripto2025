import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const runtime = await prisma.botRuntime.findUnique({ where: { botId: id } });
    if (!runtime) throw new ApiError(404, "BOT_RUNTIME_NOT_FOUND");
    return NextResponse.json({ ok: true, runtime });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
