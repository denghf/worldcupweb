import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();
    if (userId) where.userId = Number(userId);

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
