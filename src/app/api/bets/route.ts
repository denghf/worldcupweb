import { NextRequest } from "next/server";
import { BetType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentPlayerFromRequest } from "@/lib/auth";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const mine = searchParams.get("mine");

    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();
    if (userId) where.userId = Number(userId);
    if (mine) {
      const player = await getCurrentPlayerFromRequest(req);
      if (!player?.userId) return apiUnauthorized();
      where.userId = player.userId;
    }

    const bets = await prisma.bet.findMany({
      where,
      include: {
        items: {
          include: {
            match: {
              select: {
                homeTeam: true,
                awayTeam: true,
                homeScore: true,
                awayScore: true,
                status: true,
                kickoffTime: true,
              },
            },
          },
        },
        user: { select: { nickname: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(bets);
  } catch {
    return apiError("获取下注记录失败", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const player = await getCurrentPlayerFromRequest(req);
    if (!player?.userId) return apiUnauthorized();

    const currentUser = await prisma.user.findUnique({ where: { id: player.userId }, select: { mustChangePwd: true, status: true } });
    if (!currentUser || currentUser.status !== "ACTIVE") return apiError("账号不可用");
    if (currentUser.mustChangePwd) return apiError("请先修改初始密码");

    const { matchId, selections } = await req.json();
    if (!Number.isInteger(Number(matchId))) return apiError("比赛无效");
    if (!Array.isArray(selections) || selections.length === 0) return apiError("请选择投注项");

    const normalizedSelections = selections.map((s: { betType: string; optionKey: string; amount: number | string }) => ({
      betType: s.betType as BetType,
      optionKey: s.optionKey,
      amount: Number(s.amount),
    }));
    if (normalizedSelections.some((s) => !Object.values(BetType).includes(s.betType) || !s.optionKey || !Number.isFinite(s.amount) || s.amount <= 0)) {
      return apiError("投注项或金额无效");
    }

    const match = await prisma.match.findUnique({ where: { id: Number(matchId) } });
    if (!match || match.status !== "UPCOMING") return apiError("比赛不可投注");

    const odds = await prisma.odds.findMany({
      where: {
        matchId: Number(matchId),
        OR: normalizedSelections.map((s) => ({ betType: s.betType, optionKey: s.optionKey })),
      },
    });
    if (odds.length !== selections.length) return apiError("投注项赔率已变化，请刷新后重试");

    const oddsMap = new Map(odds.map((o) => [`${o.betType}:${o.optionKey}`, o]));
    const totalAmount = Math.round(normalizedSelections.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: player.userId } });
      const balance = Number(wallet?.balance ?? 0);
      if (balance < totalAmount) throw new Error("余额不足，无法投注");

      let balanceAfter = balance;
      const createdBets = [];

      for (const selection of normalizedSelections) {
        const odd = oddsMap.get(`${selection.betType}:${selection.optionKey}`);
        if (!odd) throw new Error("投注项赔率已变化，请刷新后重试");

        const lockedOdds = Number(odd.oddsValue);
        const potentialPayout = Math.round(selection.amount * lockedOdds * 100) / 100;
        balanceAfter = Math.round((balanceAfter - selection.amount) * 100) / 100;

        const bet = await tx.bet.create({
          data: {
            betUid: crypto.randomUUID(),
            userId: player.userId!,
            betMode: "SINGLE",
            totalAmount: selection.amount,
            status: "APPROVED",
            lockedTotalOdds: lockedOdds,
            potentialPayout,
            items: {
              create: [{
                matchId: Number(matchId),
                betMarket: odd.betType,
                selectedOption: odd.optionKey,
                lockedOdds: odd.oddsValue,
              }],
            },
          },
        });

        await tx.transaction.create({
          data: {
            userId: player.userId!,
            type: "BET",
            amount: -selection.amount,
            balanceAfter,
            relatedBetId: bet.id,
            remark: "玩家投注",
          },
        });

        createdBets.push(bet);
      }

      await tx.wallet.update({ where: { userId: player.userId }, data: { balance: balanceAfter } });
      await tx.userStats.upsert({
        where: { userId: player.userId },
        update: {
          totalBets: { increment: normalizedSelections.length },
          totalBetAmount: { increment: totalAmount },
          netProfit: { decrement: totalAmount },
        },
        create: {
          userId: player.userId!,
          totalBets: normalizedSelections.length,
          totalBetAmount: totalAmount,
          netProfit: -totalAmount,
        },
      });

      return createdBets;
    });

    return apiSuccess({ created: result.length }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "投注失败";
    if (message.includes("余额不足")) return apiError(message);
    console.error("Create bet error:", e);
    return apiError("投注失败", 500);
  }
}
