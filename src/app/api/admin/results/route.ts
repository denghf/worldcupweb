import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const matchIdRaw = searchParams.get("matchId");

  if (!matchIdRaw) {
    const matches = await prisma.match.findMany({
      where: { status: "FINISHED" },
      include: {
        tournament: { select: { name: true } },
        betItems: {
          select: {
            result: true,
            bet: { select: { id: true, totalAmount: true, actualPayout: true, status: true } },
          },
        },
      },
      orderBy: { kickoffTime: "desc" },
    });

    const settledStatuses = new Set(["WON", "LOST", "CANCELLED"]);

    const rows = matches.map((m) => {
      const betById = new Map<number, { totalAmount: number; actualPayout: number | null; status: string }>();
      let winCount = 0;
      let loseCount = 0;
      let allSettled = m.betItems.length > 0;

      for (const bi of m.betItems) {
        if (bi.result === "WON") winCount += 1;
        else if (bi.result === "LOST") loseCount += 1;
        if (!settledStatuses.has(bi.bet.status)) allSettled = false;

        const existing = betById.get(bi.bet.id);
        if (!existing) {
          betById.set(bi.bet.id, {
            totalAmount: Number(bi.bet.totalAmount),
            actualPayout: bi.bet.actualPayout ? Number(bi.bet.actualPayout) : null,
            status: bi.bet.status,
          });
        }
      }

      const uniqueBets = Array.from(betById.values());
      const totalBetAmount = uniqueBets.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalPayout = uniqueBets.reduce(
        (sum, b) => sum + (b.actualPayout ?? 0),
        0
      );

      const hasScore = m.homeScore !== null && m.awayScore !== null;

      return {
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        kickoffTime: m.kickoffTime.toISOString(),
        tournamentName: m.tournament.name,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        halfHomeScore: m.halfHomeScore,
        halfAwayScore: m.halfAwayScore,
        finalHomeScore: m.finalHomeScore,
        finalAwayScore: m.finalAwayScore,
        betCount: uniqueBets.length,
        betItemCount: m.betItems.length,
        winCount,
        loseCount,
        totalBetAmount,
        totalPayout,
        hasScore,
        settled: allSettled,
      };
    });

    return apiSuccess(rows);
  }

  const matchId = Number(matchIdRaw);
  if (Number.isNaN(matchId)) return apiError("matchId 无效", 400);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: { select: { name: true } },
      odds: { orderBy: { id: "asc" } },
      betItems: {
        include: {
          bet: {
            include: { user: { select: { nickname: true } } },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!match) return apiError("比赛不存在", 404);

  return apiSuccess({
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    kickoffTime: match.kickoffTime.toISOString(),
    tournamentName: match.tournament.name,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    halfHomeScore: match.halfHomeScore,
    halfAwayScore: match.halfAwayScore,
    finalHomeScore: match.finalHomeScore,
    finalAwayScore: match.finalAwayScore,
    odds: match.odds.map((o) => ({
      id: o.id,
      betType: o.betType,
      optionKey: o.optionKey,
      oddsValue: Number(o.oddsValue),
    })),
    betItems: match.betItems.map((bi) => ({
      id: bi.id,
      betMarket: bi.betMarket,
      selectedOption: bi.selectedOption,
      lockedOdds: Number(bi.lockedOdds),
      result: bi.result,
      bet: {
        id: bi.bet.id,
        betUid: bi.bet.betUid,
        betMode: bi.bet.betMode,
        totalAmount: Number(bi.bet.totalAmount),
        status: bi.bet.status,
        actualPayout: bi.bet.actualPayout ? Number(bi.bet.actualPayout) : null,
        user: bi.bet.user,
      },
    })),
  });
});
