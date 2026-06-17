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

    const body = await req.json();

    if (body.betMode === "PARLAY") {
      const items = body.items as { matchId: number | string; betMarket: string; selectedOption: string }[];
      const totalAmount = Math.round(Number(body.totalAmount) * 100) / 100;
      if (!Array.isArray(items) || items.length < 2) return apiError("串关至少选择 2 场比赛");
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) return apiError("投注金额无效");

      const normalizedItems = items.map((item) => ({
        matchId: Number(item.matchId),
        betMarket: item.betMarket as BetType,
        selectedOption: item.selectedOption,
      }));
      if (normalizedItems.some((item) => !Number.isInteger(item.matchId) || !Object.values(BetType).includes(item.betMarket) || !item.selectedOption)) {
        return apiError("串关投注项无效");
      }
      if (new Set(normalizedItems.map((item) => item.matchId)).size !== normalizedItems.length) {
        return apiError("同一场比赛只能选择一个串关选项");
      }

      const matches = await prisma.match.findMany({
        where: { id: { in: normalizedItems.map((item) => item.matchId) } },
        select: { id: true, status: true, kickoffTime: true },
      });
      if (matches.length !== normalizedItems.length) return apiError("部分比赛不存在");
      const now = Date.now();
      if (matches.some((match) => match.status !== "UPCOMING" || match.kickoffTime.getTime() <= now)) {
        return apiError("所选比赛已不可投注，请重新选择");
      }

      const odds = await prisma.odds.findMany({
        where: {
          OR: normalizedItems.map((item) => ({
            matchId: item.matchId,
            betType: item.betMarket,
            optionKey: item.selectedOption,
          })),
        },
      });
      if (odds.length !== normalizedItems.length) return apiError("投注项赔率已变化，请刷新后重试");

      const oddsMap = new Map(odds.map((odd) => [`${odd.matchId}:${odd.betType}:${odd.optionKey}`, odd]));
      const lockedTotalOdds = Math.round(
        normalizedItems.reduce((acc, item) => {
          const odd = oddsMap.get(`${item.matchId}:${item.betMarket}:${item.selectedOption}`);
          return acc * Number(odd?.oddsValue ?? 0);
        }, 1) * 100
      ) / 100;
      if (!Number.isFinite(lockedTotalOdds) || lockedTotalOdds <= 0) return apiError("投注项赔率已变化，请刷新后重试");
      const potentialPayout = Math.round(totalAmount * lockedTotalOdds * 100) / 100;

      const bet = await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({ where: { userId: player.userId } });
        const balance = Number(wallet?.balance ?? 0);
        if (balance < totalAmount) throw new Error("余额不足，无法投注");
        const balanceAfter = Math.round((balance - totalAmount) * 100) / 100;

        const createdBet = await tx.bet.create({
          data: {
            betUid: crypto.randomUUID(),
            userId: player.userId!,
            betMode: "PARLAY",
            totalAmount,
            status: "APPROVED",
            lockedTotalOdds,
            potentialPayout,
            items: {
              create: normalizedItems.map((item) => {
                const odd = oddsMap.get(`${item.matchId}:${item.betMarket}:${item.selectedOption}`);
                if (!odd) throw new Error("投注项赔率已变化，请刷新后重试");
                return {
                  matchId: item.matchId,
                  betMarket: odd.betType,
                  selectedOption: odd.optionKey,
                  lockedOdds: odd.oddsValue,
                };
              }),
            },
          },
        });

        await tx.transaction.create({
          data: {
            userId: player.userId!,
            type: "BET",
            amount: -totalAmount,
            balanceAfter,
            relatedBetId: createdBet.id,
            remark: "玩家串关投注",
          },
        });
        await tx.wallet.update({ where: { userId: player.userId }, data: { balance: balanceAfter } });
        return createdBet;
      });

      return apiSuccess({ created: 1, betMode: "PARLAY", betId: bet.id }, 201);
    }

    const { matchId, selections } = body;
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
