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

    // 同时将关联的 APPROVED 下注单标记为 ACTIVE
    if (result.count > 0) {
      const sealedMatches = await prisma.match.findMany({
        where: { status: "SEALED" },
        select: { id: true },
      });
      const matchIds = sealedMatches.map((m) => m.id);

      await prisma.bet.updateMany({
        where: {
          status: "APPROVED",
          items: { some: { matchId: { in: matchIds } } },
        },
        data: { status: "ACTIVE" },
      });
    }

    return apiSuccess({ sealed: result.count });
  } catch (e) {
    console.error("Cron seal error:", e);
    return apiError("封盘失败", 500);
  }
}
