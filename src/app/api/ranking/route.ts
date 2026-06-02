import { prisma } from "@/lib/db";
import { apiSuccess } from "@/lib/response";

export async function GET() {
  const rankings = await prisma.userStats.findMany({
    where: { totalBets: { gt: 0 } },
    include: { user: { select: { nickname: true, avatar: true } } },
    orderBy: { netProfit: "desc" },
  });

  const enriched = rankings.map((r, i) => ({
    rank: i + 1,
    nickname: r.user.nickname,
    avatar: r.user.avatar,
    totalBets: r.totalBets,
    totalWonBets: r.totalWonBets,
    totalBetAmount: Number(r.totalBetAmount),
    totalWinAmount: Number(r.totalWinAmount),
    netProfit: Number(r.netProfit),
    winRate: r.totalBets > 0 ? Math.round((r.totalWonBets / r.totalBets) * 100) : 0,
  }));

  return apiSuccess(enriched);
}
