import { prisma } from "@/lib/db";
import { apiSuccess } from "@/lib/response";

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export async function GET() {
  const settledBets = await prisma.bet.findMany({
    where: { status: { in: ["WON", "LOST"] } },
    select: {
      userId: true,
      status: true,
      totalAmount: true,
      actualPayout: true,
      user: { select: { nickname: true, avatar: true } },
    },
  });

  const rankingMap = new Map<
    number,
    {
      nickname: string;
      avatar: string | null;
      totalBets: number;
      totalWonBets: number;
      totalBetAmount: number;
      totalWinAmount: number;
    }
  >();

  for (const bet of settledBets) {
    const current = rankingMap.get(bet.userId) ?? {
      nickname: bet.user.nickname,
      avatar: bet.user.avatar,
      totalBets: 0,
      totalWonBets: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
    };

    current.totalBets += 1;
    current.totalWonBets += bet.status === "WON" ? 1 : 0;
    current.totalBetAmount += Number(bet.totalAmount);
    current.totalWinAmount += Number(bet.actualPayout ?? 0);
    rankingMap.set(bet.userId, current);
  }

  const enriched = Array.from(rankingMap.values())
    .map((r) => {
      const totalBetAmount = roundMoney(r.totalBetAmount);
      const totalWinAmount = roundMoney(r.totalWinAmount);
      const netProfit = roundMoney(totalWinAmount - totalBetAmount);
      return {
        ...r,
        totalBetAmount,
        totalWinAmount,
        netProfit,
        winRate: r.totalBets > 0 ? Math.round((r.totalWonBets / r.totalBets) * 100) : 0,
      };
    })
    .sort((a, b) => b.netProfit - a.netProfit)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return apiSuccess(enriched);
}
