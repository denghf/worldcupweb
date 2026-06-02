import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";

function transformOdds(odds: { betType: string; optionKey: string; oddsValue: unknown }[]) {
  const result = {
    x1x: {} as Record<string, number>,
    handicapX1x: {} as Record<string, number>,
    halfFull: [] as { label: string; value: number }[],
    totalGoals: [] as { label: string; value: number }[],
    correctScore: [] as { label: string; value: number }[],
  };

  for (const o of odds) {
    if (o.betType === "X1X") {
      result.x1x[o.optionKey] = Number(o.oddsValue);
    } else if (o.betType === "HANDICAP_X1X") {
      result.handicapX1x[o.optionKey] = Number(o.oddsValue);
    } else if (o.betType === "HALF_FULL") {
      result.halfFull.push({ label: o.optionKey, value: Number(o.oddsValue) });
    } else if (o.betType === "TOTAL_GOALS") {
      result.totalGoals.push({ label: o.optionKey, value: Number(o.oddsValue) });
    } else if (o.betType === "CORRECT_SCORE") {
      result.correctScore.push({ label: o.optionKey, value: Number(o.oddsValue) });
    }
  }

  // Sort for consistent display
  const tgOrder = ["0球", "1球", "2球", "3球", "4球", "5球", "6球", "7+", "3球+"];
  result.totalGoals.sort((a, b) => tgOrder.indexOf(a.label) - tgOrder.indexOf(b.label));

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");
    const date = searchParams.get("date");

    const where: Record<string, unknown> = {};
    if (tournamentId) where.tournamentId = Number(tournamentId);
    if (date) {
      const start = new Date(date + "T00:00:00Z");
      const end = new Date(date + "T23:59:59Z");
      where.kickoffTime = { gte: start, lte: end };
    }

    const matches = await prisma.match.findMany({
      where,
      include: { odds: true, tournament: { select: { name: true } } },
      orderBy: { kickoffTime: "asc" },
    });

    const transformed = matches.map((m) => ({
      id: m.id,
      tournamentId: m.tournamentId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeTeamLogo: m.homeTeamLogo,
      awayTeamLogo: m.awayTeamLogo,
      kickoffTime: m.kickoffTime.toISOString(),
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      halfHomeScore: m.halfHomeScore,
      halfAwayScore: m.halfAwayScore,
      finalHomeScore: m.finalHomeScore,
      finalAwayScore: m.finalAwayScore,
      tournamentName: m.tournament.name,
      odds: transformOdds(m.odds),
    }));

    return apiSuccess(transformed);
  } catch {
    return apiError("获取赛事失败", 500);
  }
}
