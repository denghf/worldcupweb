import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";
import { mergeDuplicateMatches } from "@/lib/match-merge";
import { BEIJING_DEDUP_MIN_DATE } from "@/lib/beijing-time";

export const POST = withAdmin(async () => {
  try {
    const summary = await mergeDuplicateMatches({ minDate: BEIJING_DEDUP_MIN_DATE });
    return apiSuccess(summary);
  } catch (e) {
    console.error("Dedup error:", e);
    return apiError("合并失败: " + (e instanceof Error ? e.message : String(e)), 500);
  }
});
