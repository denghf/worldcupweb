import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateBetSelection } from "@/lib/bet-settlement";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { matchId, homeScore, awayScore, halfHomeScore, halfAwayScore, finalHomeScore, finalAwayScore } = await req.json();

    if (matchId === undefined || homeScore === undefined || awayScore === undefined) {
      return apiError("比赛ID、全场比分为必填");
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
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

    await settleMatch(
      Number(matchId),
      Number(homeScore),
      Number(awayScore),
      parsedHalfHomeScore,
      parsedHalfAwayScore,
      parsedFinalHomeScore,
      parsedFinalAwayScore
    );

    return apiSuccess({ message: "结算完成" });
  } catch (e) {
    console.error("Settle match error:", e);
    return apiError("结算失败", 500);
  }
});

async function settleMatch(
  matchId: number,
  homeScore: number,
  awayScore: number,
  halfHomeScore?: number,
  halfAwayScore?: number,
  finalHomeScore?: number,
  finalAwayScore?: number
) {
  await prisma.$transaction(async (tx) => {
    // 1. 更新比赛比分
    await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        halfHomeScore,
        halfAwayScore,
        finalHomeScore,
        finalAwayScore,
        status: "FINISHED",
      },
    });

    // 2. 找到该比赛的所有 bet items
    const allBetItems = await tx.betItem.findMany({
      where: { matchId },
      include: { bet: true },
    });

    const affectedBetIds = [...new Set(allBetItems.map((i) => i.betId))];
    const affectedUserIds = new Set<number>();

    // 3. 回退已结算的下注（WON/LOST → APPROVED）
    const settledBets = await tx.bet.findMany({
      where: { id: { in: affectedBetIds }, status: { in: ["WON", "LOST"] } },
      include: { items: true },
    });

    for (const bet of settledBets) {
      if (bet.status === "WON") {
        const payout = Number(bet.actualPayout);
        const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
        const newBalance = Number(wallet!.balance) - payout;

        await tx.wallet.update({
          where: { userId: bet.userId },
          data: { balance: newBalance },
        });

        await tx.transaction.create({
          data: {
            userId: bet.userId,
            type: "ADJUST",
            amount: -payout,
            balanceAfter: newBalance,
            relatedBetId: bet.id,
            remark: "结算修正回退",
          },
        });
      }

      await tx.bet.update({
        where: { id: bet.id },
        data: { status: "APPROVED", actualPayout: 0, settledAt: null },
      });

      affectedUserIds.add(bet.userId);
    }

    // 4. 重置所有该比赛的 bet items 为 PENDING
    for (const item of allBetItems) {
      await tx.betItem.update({
        where: { id: item.id },
        data: { result: "PENDING", settledAt: null },
      });
    }

    // 5. 重新评估所有 items
    for (const item of allBetItems) {
      const won = evaluateBetSelection({
        market: item.betMarket,
        selectedOption: item.selectedOption,
        homeScore,
        awayScore,
        halfHomeScore,
        halfAwayScore,
      });

      await tx.betItem.update({
        where: { id: item.id },
        data: { result: won ? "WON" : "LOST", settledAt: new Date() },
      });
    }

    // 6. 重新结算受影响的下注
    const affectedBets = await tx.bet.findMany({
      where: {
        id: { in: affectedBetIds },
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

      affectedUserIds.add(bet.userId);
    }

    // 7. 更新所有受影响用户的统计
    for (const userId of affectedUserIds) {
      await updateUserStats(tx, userId);
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
  const totalBetAmount = bets.reduce(
    (s: number, b: { totalAmount: { toNumber: () => number } }) => s + Number(b.totalAmount),
    0
  );
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
