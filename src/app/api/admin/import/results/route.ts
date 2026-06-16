import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";
import { import500Results } from "@/lib/import-500-results";
import { getTodayShanghai } from "@/lib/import-500-odds";
import { safeRecordPullLog } from "@/lib/pull-logs";

export const POST = withAdmin(async (req: NextRequest) => {
  const startedAt = new Date();
  const body = await req.json().catch(() => ({}));
  const date = (body as { date?: string }).date || getTodayShanghai();

  try {
    const summary = await import500Results(date);
    await safeRecordPullLog({
      trigger: "MANUAL",
      kind: "RESULTS",
      status: "SUCCESS",
      importDate: date,
      startedAt,
      finishedAt: new Date(),
      summary,
    });
    return apiSuccess(summary);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await safeRecordPullLog({
      trigger: "MANUAL",
      kind: "RESULTS",
      status: "FAILED",
      importDate: date,
      startedAt,
      finishedAt: new Date(),
      error: message,
    });
    console.error("500.com results error:", e);
    return apiError("抓取赛果失败: " + message, 500);
  }
});
