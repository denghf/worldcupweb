import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "./auth";
import { apiUnauthorized } from "./response";

type Handler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withAdmin(handler: Handler) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ) => {
    const admin = await getCurrentAdmin();
    if (!admin) return apiUnauthorized();
    return handler(req, ctx);
  };
}
