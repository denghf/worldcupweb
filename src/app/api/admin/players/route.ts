import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

export const GET = withAdmin(async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      nickname: true,
      role: true,
      status: true,
      createdAt: true,
      stats: { select: { totalBets: true, totalBetAmount: true, totalWonBets: true, netProfit: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(
    users.map((u) => ({
      ...u,
      totalBets: u.stats?.totalBets ?? 0,
      totalBetAmount: Number(u.stats?.totalBetAmount ?? 0),
      totalWonBets: u.stats?.totalWonBets ?? 0,
      netProfit: Number(u.stats?.netProfit ?? 0),
    }))
  );
});

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { username, nickname } = await req.json();

    if (!username || !nickname) {
      return apiError("用户名和昵称为必填");
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return apiError("用户名只能包含字母、数字和下划线");
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return apiError("用户名已存在");
    }

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { username, nickname, role: "PLAYER" },
      });
      await tx.wallet.create({ data: { userId: u.id, balance: 0 } });
      await tx.userStats.create({ data: { userId: u.id } });
      return u;
    });

    return apiSuccess(user);
  } catch (e) {
    console.error("Create player error:", e);
    return apiError("添加玩家失败", 500);
  }
});

export const PATCH = withAdmin(async (req: NextRequest) => {
  try {
    const { userId, status, nickname } = await req.json();

    if (!userId) return apiError("玩家ID必填");

    if (status) {
      await prisma.user.update({
        where: { id: userId },
        data: { status },
      });
      return apiSuccess({ message: "状态已更新" });
    }

    if (nickname !== undefined) {
      if (!nickname.trim()) return apiError("昵称不能为空");
      await prisma.user.update({
        where: { id: userId },
        data: { nickname: nickname.trim() },
      });
      return apiSuccess({ message: "昵称已更新" });
    }

    return apiError("无有效操作");
  } catch (e) {
    console.error("Update player error:", e);
    return apiError("操作失败", 500);
  }
});

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const { userId } = await req.json();
    if (!userId) return apiError("玩家ID必填");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return apiError("玩家不存在");

    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { userId } });
      const bets = await tx.bet.findMany({
        where: { userId },
        select: { id: true },
      });
      if (bets.length > 0) {
        await tx.betItem.deleteMany({ where: { betId: { in: bets.map((b) => b.id) } } });
        await tx.bet.deleteMany({ where: { userId } });
      }
      await tx.user.delete({ where: { id: userId } });
    });

    return apiSuccess({ message: "玩家已删除" });
  } catch (e) {
    console.error("Delete player error:", e);
    return apiError("删除失败", 500);
  }
});
