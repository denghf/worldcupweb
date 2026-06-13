import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { settleMatchResult } from "@/lib/match-settlement";
import { apiSuccess, apiError } from "@/lib/response";
import { fetchFixtureResult } from "@/lib/api-football";

// 检查已结束比赛的赛果，触发结算
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return apiError("Forbidden", 403);
  }

  try {
    const matches = await prisma.match.findMany({
      where: {
        status: { in: ["SEALED", "LIVE"] },
        kickoffTime: { lt: new Date() },
      },
    });

    let settled = 0;

    for (const match of matches) {
      try {
        const results = await fetchFixtureResult(Number(match.apiMatchId));
        if (!results.length) continue;

        const result = results[0];
        if (!["FT", "AET", "PEN"].includes(result.fixture.status.short)) continue;

        const homeScore = result.score.fulltime.home ?? result.goals.home;
        const awayScore = result.score.fulltime.away ?? result.goals.away;
        if (homeScore === null || awayScore === null) continue;

        const halfHomeScore = result.score.halftime.home ?? undefined;
        const halfAwayScore = result.score.halftime.away ?? undefined;

        await settleMatchResult({
          matchId: match.id,
          homeScore,
          awayScore,
          halfHomeScore,
          halfAwayScore,
          finalHomeScore: result.goals.home ?? homeScore,
          finalAwayScore: result.goals.away ?? awayScore,
          allowResettle: false,
        });
        settled++;
      } catch (e) {
        console.error(`Settle error for match ${match.id}:`, e);
      }
    }

    return apiSuccess({ checked: matches.length, settled });
  } catch (e) {
    console.error("Cron results error:", e);
    return apiError("结算失败", 500);
  }
}
