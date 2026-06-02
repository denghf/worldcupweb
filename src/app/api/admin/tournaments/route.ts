import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

export const GET = withAdmin(async () => {
  const tournaments = await prisma.tournament.findMany({
    include: { _count: { select: { matches: true } } },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(tournaments);
});

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { name, leagueId, season, startDate, endDate } = await req.json();

    if (!name || !leagueId || !season || !startDate || !endDate) {
      return apiError("所有字段都为必填");
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        leagueId: Number(leagueId),
        season,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return apiSuccess(tournament);
  } catch {
    return apiError("创建赛事失败", 500);
  }
});
