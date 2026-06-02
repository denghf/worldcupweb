import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";

// 自动封盘：开赛时间到的比赛标记为 SEALED
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return apiError("Forbidden", 403);
  }

  try {
    const now = new Date();

    const result = await prisma.match.updateMany({
      where: {
        status: "UPCOMING",
        kickoffTime: { lte: now },
      },
      data: { status: "SEALED" },
    });

    // 下注单保持 APPROVED 状态，无需转为 ACTIVE

    return apiSuccess({ sealed: result.count });
  } catch (e) {
    console.error("Cron seal error:", e);
    return apiError("封盘失败", 500);
  }
}
