import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";
import { randomUUID } from "crypto";

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();

  const bets = await prisma.bet.findMany({
    where,
    include: {
      user: { select: { nickname: true, username: true } },
      items: {
        include: {
          match: { select: { homeTeam: true, awayTeam: true, kickoffTime: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(bets);
});

// 管理员录入下注
export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { userId, items, totalAmount } = await req.json();

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return apiError("参数缺失：玩家、赛事选择和金额为必填");
    }
    if (!totalAmount || totalAmount <= 0) {
      return apiError("下注金额必须大于0");
    }

    // 验证用户存在
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return apiError("玩家不存在");

    // 验证比赛
    const matchIds = items.map((item: { matchId: number }) => item.matchId);
    const matches = await prisma.match.findMany({
      where: { id: { in: matchIds } },
      include: { odds: true },
    });

    for (const item of items) {
      const match = matches.find((m) => m.id === item.matchId);
      if (!match) return apiError("比赛不存在");
      if (match.status !== "UPCOMING") {
        return apiError(`${match.homeTeam} vs ${match.awayTeam} 已封盘`);
      }
    }

    // 验证赔率并锁定
    let totalOdds = 1;
    const betItemsData: {
      matchId: number;
      betMarket: "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE";
      selectedOption: string;
      lockedOdds: number;
    }[] = [];

    for (const item of items) {
      const match = matches.find((m) => m.id === item.matchId)!;
      const odds = match.odds.find(
        (o) => o.betType === item.betMarket && o.optionKey === item.selectedOption
      );
      if (!odds) {
        return apiError(`${match.homeTeam} vs ${match.awayTeam} 该玩法暂无赔率`);
      }
      totalOdds *= Number(odds.oddsValue);
      betItemsData.push({
        matchId: match.id,
        betMarket: item.betMarket,
        selectedOption: item.selectedOption,
        lockedOdds: Number(odds.oddsValue),
      });
    }

    const roundedTotalOdds = Math.round(totalOdds * 100) / 100;
    const potentialPayout = Math.round(totalAmount * roundedTotalOdds * 100) / 100;

    const bet = await prisma.$transaction(async (tx) => {
      const betMode = items.length === 1 ? "SINGLE" : "PARLAY";

      const bet = await tx.bet.create({
        data: {
          betUid: randomUUID(),
          userId,
          betMode,
          totalAmount,
          status: "APPROVED",
          lockedTotalOdds: roundedTotalOdds,
          potentialPayout,
          items: { create: betItemsData },
        },
        include: { items: true, user: { select: { nickname: true } } },
      });

      return bet;
    });

    return apiSuccess(bet);
  } catch (e) {
    console.error("Admin bet entry error:", e);
    return apiError("录入失败", 500);
  }
});

// 审核下注
export const PATCH = withAdmin(async (req: NextRequest) => {
  try {
    const { betId, action, rejectReason } = await req.json();

    if (!betId || !action) return apiError("参数缺失");
    if (!["approve", "reject"].includes(action)) return apiError("无效操作");

    const bet = await prisma.bet.findUnique({ where: { id: betId } });
    if (!bet) return apiError("下注单不存在");
    if (bet.status !== "PENDING_REVIEW") return apiError("该下注单不在待审核状态");

    if (action === "reject") {
      await prisma.bet.update({
        where: { id: betId },
        data: { status: "CANCELLED", rejectReason: rejectReason || "管理员拒绝" },
      });
      return apiSuccess({ message: "已拒绝" });
    }

    const updatedBet = await prisma.bet.update({
      where: { id: betId },
      data: { status: "APPROVED" },
    });

    return apiSuccess(updatedBet);
  } catch (e) {
    console.error("Review error:", e);
    return apiError("操作失败", 500);
  }
});
