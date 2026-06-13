import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evaluateBetSelection } from "@/lib/bet-settlement";

type SettleMatchResultInput = {
  matchId: number;
  homeScore: number;
  awayScore: number;
  halfHomeScore?: number;
  halfAwayScore?: number;
  finalHomeScore?: number;
  finalAwayScore?: number;
  allowResettle?: boolean;
};

export async function settleMatchResult({
  matchId,
  homeScore,
  awayScore,
  halfHomeScore,
  halfAwayScore,
  finalHomeScore,
  finalAwayScore,
  allowResettle = true,
}: SettleMatchResultInput) {
  await prisma.$transaction(async (tx) => {
    const allBetItems = await tx.betItem.findMany({
      where: { matchId },
      include: { bet: true },
    });

    if (allBetItems.some((item) => item.betMarket === "HALF_FULL") && (halfHomeScore === undefined || halfAwayScore === undefined)) {
      throw new Error("该比赛有半全场下注，结算时需要填写半场比分");
    }

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

    const affectedBetIds = [...new Set(allBetItems.map((item) => item.betId))];
    const affectedUserIds = new Set<number>();

    const settledBets = await tx.bet.findMany({
      where: { id: { in: affectedBetIds }, status: { in: ["WON", "LOST"] } },
      include: { items: true },
    });

    if (!allowResettle && settledBets.length > 0) {
      throw new Error("该比赛已有已结算下注，不能重复自动结算");
    }

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

    for (const item of allBetItems) {
      await tx.betItem.update({
        where: { id: item.id },
        data: { result: "PENDING", settledAt: null },
      });
    }

    for (const item of allBetItems) {
      const won = evaluateBetSelection({
        market: item.betMarket,
        selectedOption: item.selectedOption,
        homeScore,
        awayScore,
        halfHomeScore,
        halfAwayScore,
      });

      if (won === null) {
        throw new Error("缺少结算所需比分，无法判定投注结果");
      }

      await tx.betItem.update({
        where: { id: item.id },
        data: { result: won ? "WON" : "LOST", settledAt: new Date() },
      });
    }

    const affectedBets = await tx.bet.findMany({
      where: {
        id: { in: affectedBetIds },
        status: { in: ["APPROVED"] },
      },
      include: { items: true },
    });

    for (const bet of affectedBets) {
      const allSettled = bet.items.every((item) => item.result !== "PENDING");
      if (!allSettled) continue;

      const allWon = bet.items.every((item) => item.result === "WON");
      const anyLost = bet.items.some((item) => item.result === "LOST");

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

    for (const userId of affectedUserIds) {
      await updateUserStats(tx, userId);
    }
  });
}

async function updateUserStats(tx: Prisma.TransactionClient, userId: number) {
  const bets = await tx.bet.findMany({
    where: { userId, status: { in: ["WON", "LOST"] } },
  });

  const totalBets = bets.length;
  const totalWonBets = bets.filter((bet) => bet.status === "WON").length;
  const totalBetAmount = bets.reduce((sum, bet) => sum + Number(bet.totalAmount), 0);
  const totalWinAmount = bets.reduce((sum, bet) => sum + Number(bet.actualPayout ?? 0), 0);
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
