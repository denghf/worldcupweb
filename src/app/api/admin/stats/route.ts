import { prisma } from "@/lib/db";
import { apiSuccess } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

const PROFIT_CHART_START_DATE = "2026-06-12";

function dateKeyFrom(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateLabelFrom(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function buildDateRange(start: Date, end: Date) {
  const result: { key: string; label: string }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor <= stop) {
    result.push({ key: dateKeyFrom(cursor), label: dateLabelFrom(cursor) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

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
    activePlayers,
    chartBets,
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
    prisma.user.findMany({
      where: { role: "PLAYER", status: "ACTIVE" },
      select: { id: true, nickname: true },
      orderBy: [{ nickname: "asc" }, { id: "asc" }],
    }),
    prisma.bet.findMany({
      where: {
        status: { in: ["WON", "LOST"] },
        settledAt: { gte: new Date(`${PROFIT_CHART_START_DATE}T00:00:00+08:00`) },
        user: { role: "PLAYER", status: "ACTIVE" },
      },
      select: {
        userId: true,
        totalAmount: true,
        actualPayout: true,
        settledAt: true,
      },
      orderBy: { settledAt: "asc" },
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

  const profitCharts = buildProfitCharts(activePlayers, chartBets);

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
    profitCharts,
  });
});

type ChartPlayerInput = { id: number; nickname: string };
type ChartBetInput = {
  userId: number;
  totalAmount: unknown;
  actualPayout: unknown;
  settledAt: Date | null;
};

function buildProfitCharts(players: ChartPlayerInput[], bets: ChartBetInput[]) {
  const startDate = new Date(`${PROFIT_CHART_START_DATE}T00:00:00+08:00`);
  const endDate = new Date();
  const dates = buildDateRange(startDate, endDate);
  const dateKeySet = new Set(dates.map((d) => d.key));

  const dailyByPlayer = new Map<number, Map<string, number>>();
  for (const player of players) {
    dailyByPlayer.set(player.id, new Map());
  }

  for (const bet of bets) {
    if (!bet.settledAt) continue;
    const local = new Date(bet.settledAt.getTime() + 8 * 60 * 60 * 1000);
    const key = dateKeyFrom(local);
    if (!dateKeySet.has(key)) continue;
    const profit = Number(bet.actualPayout ?? 0) - Number(bet.totalAmount ?? 0);
    const playerMap = dailyByPlayer.get(bet.userId);
    if (!playerMap) continue;
    playerMap.set(key, (playerMap.get(key) ?? 0) + profit);
  }

  const playersPayload = players.map((player) => {
    const dailyMap = dailyByPlayer.get(player.id)!;
    let running = 0;
    const points = dates.map((d) => {
      const dailyProfit = roundMoney(dailyMap.get(d.key) ?? 0);
      running += dailyProfit;
      return {
        date: d.key,
        label: d.label,
        dailyProfit,
        cumulativeProfit: roundMoney(running),
      };
    });
    return {
      id: player.id,
      nickname: player.nickname,
      totalProfit: points.length ? points[points.length - 1].cumulativeProfit : 0,
      points,
    };
  });

  return {
    startDate: PROFIT_CHART_START_DATE,
    endDate: dates.length ? dates[dates.length - 1].key : PROFIT_CHART_START_DATE,
    dates,
    players: playersPayload,
  };
}
