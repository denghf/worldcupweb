import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";
import { import500Results } from "@/lib/import-500-results";
import { getTodayShanghai } from "@/lib/import-500-odds";

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const date = (body as { date?: string }).date || getTodayShanghai();
    return apiSuccess(await import500Results(date));
  } catch (e) {
    console.error("500.com results error:", e);
    return apiError("抓取赛果失败: " + (e instanceof Error ? e.message : String(e)), 500);
  }
});
