import { prisma } from "@/lib/db";
import { apiSuccess } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

export const GET = withAdmin(async () => {
  const [
    totalBets,
    totalBetAmountAgg,
    totalPayoutAgg,
    totalUsers,
    pendingReviewCount,
    activeBetsCount,
    wonBetsCount,
    lostBetsCount,
    topUsers,
    recentBets,
  ] = await Promise.all([
    prisma.bet.count(),
    prisma.bet.aggregate({ _sum: { totalAmount: true } }),
    prisma.bet.aggregate({ _sum: { actualPayout: true } }),
    prisma.user.count({ where: { role: "PLAYER" } }),
    prisma.bet.count({ where: { status: "APPROVED" } }),
    prisma.bet.count({ where: { status: "APPROVED" } }),
    prisma.bet.count({ where: { status: "WON" } }),
    prisma.bet.count({ where: { status: "LOST" } }),
    prisma.userStats.findMany({
      where: { totalBets: { gt: 0 } },
      include: { user: { select: { nickname: true } } },
      orderBy: { netProfit: "desc" },
    }),
    prisma.bet.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: { createdAt: true, totalAmount: true, actualPayout: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalBetAmount = Number(totalBetAmountAgg._sum.totalAmount ?? 0);
  const totalPayout = Number(totalPayoutAgg._sum.actualPayout ?? 0);
  const netProfit = totalBetAmount - totalPayout;

  // Aggregate daily stats in JS
  const dailyMap = new Map<string, { date: string; bets: number; amount: number; payout: number }>();
  for (const bet of recentBets) {
    const dateStr = bet.createdAt.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }).replace("/", "/");
    const existing = dailyMap.get(dateStr);
    if (existing) {
      existing.bets += 1;
      existing.amount += Number(bet.totalAmount);
      existing.payout += Number(bet.actualPayout ?? 0);
    } else {
      dailyMap.set(dateStr, {
        date: dateStr,
        bets: 1,
        amount: Number(bet.totalAmount),
        payout: Number(bet.actualPayout ?? 0),
      });
    }
  }
  const dailyBets = Array.from(dailyMap.values());

  return apiSuccess({
    totalBets,
    totalBetAmount,
    totalPayout,
    netProfit,
    totalUsers,
    pendingReviewCount,
    activeBetsCount,
    wonBetsCount,
    lostBetsCount,
    topUsers: topUsers.map((u) => {
      const totalBetAmount = Number(u.totalBetAmount);
      const totalWinAmount = Number(u.totalWinAmount);
      return {
        nickname: u.user.nickname,
        totalBetAmount,
        totalWinAmount,
        totalBets: u.totalBets,
        totalWonBets: u.totalWonBets,
        netProfit: Number(u.netProfit),
        winRate: u.totalBets > 0 ? (u.totalWonBets / u.totalBets) * 100 : 0,
        returnRate: totalBetAmount > 0 ? (totalWinAmount / totalBetAmount) * 100 : 0,
      };
    }),
    dailyBets,
  });
});
