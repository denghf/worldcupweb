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
      wallet: { select: { balance: true } },
      stats: { select: { totalBets: true, netProfit: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(
    users.map((u) => ({
      ...u,
      balance: Number(u.wallet?.balance ?? 0),
      totalBets: u.stats?.totalBets ?? 0,
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
    const { userId, status, balanceDelta, remark } = await req.json();

    if (!userId) return apiError("玩家ID必填");

    if (status) {
      await prisma.user.update({
        where: { id: userId },
        data: { status },
      });
      return apiSuccess({ message: "状态已更新" });
    }

    if (balanceDelta) {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) return apiError("钱包不存在");

      const newBalance = Number(wallet.balance) + balanceDelta;
      if (newBalance < 0) return apiError("余额不能为负数");

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId },
          data: { balance: newBalance },
        });
        await tx.transaction.create({
          data: {
            userId,
            type: balanceDelta > 0 ? "RECHARGE" : "ADJUST",
            amount: balanceDelta,
            balanceAfter: newBalance,
            remark: remark || `[管理员操作] ${balanceDelta > 0 ? "充值" : "扣减"}`,
          },
        });
      });

      return apiSuccess({ newBalance });
    }

    return apiError("无有效操作");
  } catch (e) {
    console.error("Update player error:", e);
    return apiError("操作失败", 500);
  }
});
