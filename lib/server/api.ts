import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

export async function parseJson<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const payload: unknown = await request.json().catch(() => null);
  const result = schema.safeParse(payload);
  if (!result.success) throw new ApiError(400, "INVALID_PAYLOAD", result.error.flatten());
  return result.data;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(code);
  }
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ ok: false, error: error.code, details: error.details }, { status: error.status });
  }
  return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
}
