import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPlayerFromRequest } from "@/lib/auth";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const player = await getCurrentPlayerFromRequest(req);
    if (!player?.userId) return apiUnauthorized();

    const user = await prisma.user.findUnique({
      where: { id: player.userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        mustChangePwd: true,
        wallet: { select: { balance: true } },
        stats: { select: { totalBets: true, totalWonBets: true, totalBetAmount: true, totalWinAmount: true, netProfit: true } },
      },
    });

    if (!user) return apiError("用户不存在", 404);

    return apiSuccess({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      mustChangePwd: user.mustChangePwd,
      balance: Number(user.wallet?.balance ?? 0),
      totalBets: user.stats?.totalBets ?? 0,
      totalWonBets: user.stats?.totalWonBets ?? 0,
      totalBetAmount: Number(user.stats?.totalBetAmount ?? 0),
      totalWinAmount: Number(user.stats?.totalWinAmount ?? 0),
      netProfit: Number(user.stats?.netProfit ?? 0),
    });
  } catch (e) {
    console.error("Profile error:", e);
    return apiError("获取我的信息失败", 500);
  }
}
