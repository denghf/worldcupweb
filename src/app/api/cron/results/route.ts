import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateBetSelection } from "@/lib/bet-settlement";
import { apiSuccess, apiError } from "@/lib/response";
import { fetchFixtureResult } from "@/lib/api-football";

// 检查已结束比赛的赛果，触发结算
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return apiError("Forbidden", 403);
  }

  try {
    // 找出所有 SEALED 但还没 FINISHED 的比赛
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
        const homeScore = result.goals.home;
        const awayScore = result.goals.away;

        // 只处理已完赛
        if (homeScore === null || awayScore === null) continue;
        if (!["FT", "AET", "PEN"].includes(result.fixture.status.short)) continue;

        await settleMatch(match.id, homeScore, awayScore);
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

async function settleMatch(matchId: number, homeScore: number, awayScore: number) {
  await prisma.$transaction(async (tx) => {
    // 更新比赛比分和状态
    await tx.match.update({
      where: { id: matchId },
      data: { homeScore, awayScore, status: "FINISHED" },
    });

    // 找出所有关联的 bet_items
    const betItems = await tx.betItem.findMany({
      where: { matchId, result: "PENDING" },
      include: { bet: true },
    });

    for (const item of betItems) {
      const won = evaluateBetSelection({
        market: item.betMarket,
        selectedOption: item.selectedOption,
        homeScore,
        awayScore,
      });

      await tx.betItem.update({
        where: { id: item.id },
        data: { result: won ? "WON" : "LOST", settledAt: new Date() },
      });
    }

    // 检查串关：所有 items 都结算完毕的 bet，整体判定
    const affectedBets = await tx.bet.findMany({
      where: {
        items: { some: { matchId } },
        status: { in: ["APPROVED", "ACTIVE"] },
      },
      include: { items: true },
    });

    for (const bet of affectedBets) {
      const allSettled = bet.items.every((i) => i.result !== "PENDING");
      if (!allSettled) continue;

      const allWon = bet.items.every((i) => i.result === "WON");
      const anyLost = bet.items.some((i) => i.result === "LOST");

      if (allWon) {
        const payout = Number(bet.totalAmount) * Number(bet.lockedTotalOdds);
        const roundedPayout = Math.round(payout * 100) / 100;

        await tx.bet.update({
          where: { id: bet.id },
          data: {
            status: "WON",
            actualPayout: roundedPayout,
            settledAt: new Date(),
          },
        });

        // 发放奖金
        const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
        const newBalance = Number(wallet!.balance) + roundedPayout;

        await tx.wallet.update({
          where: { userId: bet.userId },
          data: { balance: newBalance },
        });

        await tx.transaction.create({
          data: {
            userId: bet.userId,
            type: "WIN",
            amount: roundedPayout,
            balanceAfter: newBalance,
            relatedBetId: bet.id,
            remark: "中奖发放",
          },
        });
      } else if (anyLost) {
        await tx.bet.update({
          where: { id: bet.id },
          data: {
            status: "LOST",
            actualPayout: 0,
            settledAt: new Date(),
          },
        });
      }

      // 更新用户统计
      await updateUserStats(tx, bet.userId);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateUserStats(tx: any, userId: number) {
  const bets = await tx.bet.findMany({
    where: { userId, status: { in: ["WON", "LOST"] } },
  });

  const totalBets = bets.length;
  const totalWonBets = bets.filter((b: { status: string }) => b.status === "WON").length;
  const totalBetAmount = bets.reduce((s: number, b: { totalAmount: { toNumber: () => number } }) => s + Number(b.totalAmount), 0);
  const totalWinAmount = bets.reduce(
    (s: number, b: { actualPayout: { toNumber: () => number } | null }) => s + Number(b.actualPayout ?? 0),
    0
  );
  const netProfit = totalWinAmount - totalBetAmount;

  await tx.userStats.upsert({
    where: { userId },
    update: {
      totalBets,
      totalWonBets,
      totalBetAmount,
      totalWinAmount,
      netProfit,
    },
    create: {
      userId,
      totalBets,
      totalWonBets,
      totalBetAmount,
      totalWinAmount,
      netProfit,
    },
  });
}
