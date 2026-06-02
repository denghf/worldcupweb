import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

interface OddsInput {
  betType: string;
  optionKey: string;
  oddsValue: number;
}

interface MatchInput {
  apiMatchId: string;
  matchNo?: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  handicap?: number;
  odds: OddsInput[];
}

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { tournamentId, matches } = await req.json();

    if (!tournamentId) return apiError("请选择赛事");
    if (!Array.isArray(matches) || matches.length === 0) return apiError("比赛数据不能为空");

    const tournament = await prisma.tournament.findUnique({ where: { id: Number(tournamentId) } });
    if (!tournament) return apiError("赛事不存在");

    const apiMatchIds = matches.map((m: MatchInput) => m.apiMatchId);
    const existing = await prisma.match.findMany({
      where: { apiMatchId: { in: apiMatchIds } },
      select: { id: true, apiMatchId: true },
    });
    const existingMap = new Map(existing.map((m) => [m.apiMatchId, m.id]));

    // Delete old odds and matches for re-import
    if (existing.length > 0) {
      const existingIds = existing.map((m) => m.id);
      await prisma.betItem.deleteMany({ where: { matchId: { in: existingIds } } });
      await prisma.bet.deleteMany({ where: { items: { none: {} } } });
      await prisma.odds.deleteMany({ where: { matchId: { in: existingIds } } });
      await prisma.match.deleteMany({ where: { id: { in: existingIds } } });
    }

    let imported = 0;
    for (const m of matches as MatchInput[]) {
      if (!m.apiMatchId || !m.homeTeam || !m.awayTeam || !m.kickoffTime) continue;

      const match = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          apiMatchId: m.apiMatchId,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          kickoffTime: new Date(m.kickoffTime),
          status: "UPCOMING",
          oddsUpdatedAt: m.odds?.length ? new Date() : null,
        },
      });

      if (m.odds?.length) {
        await prisma.odds.createMany({
          data: m.odds.map((o) => ({
            matchId: match.id,
            betType: o.betType as "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE",
            optionKey: o.optionKey,
            oddsValue: o.oddsValue,
          })),
        });
      }

      imported++;
    }

    return apiSuccess({ imported });
  } catch (e) {
    console.error("Local import error:", e);
    return apiError("导入失败", 500);
  }
});
