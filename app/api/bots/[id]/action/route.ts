import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { botActionSchema } from "@/lib/server/schemas";

type Context = { params: Promise<{ id: string }> };
const allowedActions = new Set(["start", "pause", "stop"]);

export async function POST(request: Request, context: Context) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    await parseJson(request, botActionSchema);
    const { id } = await context.params;
    const action = new URL(request.url).searchParams.get("type") ?? "";
    if (!allowedActions.has(action)) throw new ApiError(400, "INVALID_BOT_ACTION");
    const killSwitch = await prisma.systemControl.findUnique({ where: { id: "global" } });
    if (action === "start" && killSwitch?.killSwitchActive) throw new ApiError(409, "KILL_SWITCH_ACTIVE");
    const status = action === "start" ? "RUNNING" : action === "pause" ? "PAUSED" : "STOPPED";
    const bot = await prisma.$transaction(async (tx) => {
      const updated = await tx.botConfig.update({ where: { id }, data: { status } });
      await tx.botRuntime.upsert({ where: { botId: id }, create: { botId: id, status, strategyState: {} }, update: { status, lastError: null } });
      await tx.botLog.create({ data: { botId: id, level: "INFO", event: `BOT_${status}`, message: `Bot changed to ${status} by internal API` } });
      return updated;
    });
    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
