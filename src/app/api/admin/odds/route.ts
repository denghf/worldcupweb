import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

type OddsInput = {
  betType: "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE";
  optionKey: string;
  oddsValue: number;
};

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { matchId, odds } = await req.json() as { matchId: number; odds: OddsInput[] };

    if (!matchId || !Array.isArray(odds) || odds.length === 0) {
      return apiError("比赛ID和赔率数据为必填");
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return apiError("比赛不存在");

    await prisma.$transaction(async (tx) => {
      for (const o of odds) {
        await tx.odds.upsert({
          where: {
            matchId_betType_optionKey: {
              matchId,
              betType: o.betType,
              optionKey: o.optionKey,
            },
          },
          update: { oddsValue: o.oddsValue },
          create: {
            matchId,
            betType: o.betType,
            optionKey: o.optionKey,
            oddsValue: o.oddsValue,
          },
        });
      }
    });

    await prisma.match.update({
      where: { id: matchId },
      data: { oddsUpdatedAt: new Date() },
    });

    const updatedOdds = await prisma.odds.findMany({ where: { matchId } });
    return apiSuccess(updatedOdds);
  } catch (e) {
    console.error("Update odds error:", e);
    return apiError("更新赔率失败", 500);
  }
});
