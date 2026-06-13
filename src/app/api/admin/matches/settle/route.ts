import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { settleMatchResult } from "@/lib/match-settlement";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { matchId, homeScore, awayScore, halfHomeScore, halfAwayScore, finalHomeScore, finalAwayScore } = await req.json();

    if (matchId === undefined || homeScore === undefined || awayScore === undefined) {
      return apiError("比赛ID、全场比分为必填");
    }

    const match = await prisma.match.findUnique({ where: { id: Number(matchId) } });
    if (!match) return apiError("比赛不存在");

    const parsedHalfHomeScore = halfHomeScore === undefined || halfHomeScore === "" ? undefined : Number(halfHomeScore);
    const parsedHalfAwayScore = halfAwayScore === undefined || halfAwayScore === "" ? undefined : Number(halfAwayScore);
    const parsedFinalHomeScore = finalHomeScore === undefined || finalHomeScore === "" ? undefined : Number(finalHomeScore);
    const parsedFinalAwayScore = finalAwayScore === undefined || finalAwayScore === "" ? undefined : Number(finalAwayScore);

    const hasHalfFullBet = await prisma.betItem.count({
      where: { matchId: Number(matchId), betMarket: "HALF_FULL" },
    });
    if (hasHalfFullBet > 0 && (parsedHalfHomeScore === undefined || parsedHalfAwayScore === undefined)) {
      return apiError("该比赛有半全场下注，结算时需要填写半场比分");
    }

    await settleMatchResult({
      matchId: Number(matchId),
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      halfHomeScore: parsedHalfHomeScore,
      halfAwayScore: parsedHalfAwayScore,
      finalHomeScore: parsedFinalHomeScore,
      finalAwayScore: parsedFinalAwayScore,
      allowResettle: true,
    });

    return apiSuccess({ message: "结算完成" });
  } catch (e) {
    console.error("Settle match error:", e);
    return apiError(e instanceof Error ? e.message : "结算失败", 500);
  }
});
