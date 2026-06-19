import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { tournamentId, homeTeam, awayTeam, homeTeamLogo, awayTeamLogo, kickoffTime, apiMatchId } = await req.json();

    if (!tournamentId || !homeTeam || !awayTeam || !kickoffTime) {
      return apiError("赛事ID、主队、客队、开赛时间为必填");
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: Number(tournamentId) } });
    if (!tournament) return apiError("赛事不存在");

    const match = await prisma.match.create({
      data: {
        tournamentId: Number(tournamentId),
        apiMatchId: apiMatchId || `manual-${Date.now()}`,
        homeTeam,
        awayTeam,
        homeTeamLogo: homeTeamLogo || null,
        awayTeamLogo: awayTeamLogo || null,
        kickoffTime: new Date(kickoffTime),
        status: "UPCOMING",
      },
    });

    return apiSuccess(match);
  } catch (e) {
    console.error("Create match error:", e);
    return apiError("创建比赛失败", 500);
  }
});

export const PATCH = withAdmin(async (req: NextRequest) => {
  try {
    const { matchId, status, homeScore, awayScore } = await req.json();
    if (!matchId) return apiError("比赛ID必填");

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (homeScore !== undefined) data.homeScore = homeScore;
    if (awayScore !== undefined) data.awayScore = awayScore;

    const match = await prisma.match.update({
      where: { id: matchId },
      data,
    });

    return apiSuccess(match);
  } catch (e) {
    console.error("Update match error:", e);
    return apiError("更新比赛失败", 500);
  }
});

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const { matchId } = await req.json();
    if (!matchId) return apiError("比赛ID必填");

    const match = await prisma.match.findUnique({ where: { id: Number(matchId) } });
    if (!match) return apiError("比赛不存在");
    if (match.status !== "UPCOMING" || match.kickoffTime.getTime() <= Date.now()) {
      return apiError("只能删除未开赛的赛事");
    }

    const betItemCount = await prisma.betItem.count({ where: { matchId: match.id } });
    if (betItemCount > 0) return apiError("该赛事已有下注，无法删除");

    await prisma.match.delete({ where: { id: match.id } });

    return apiSuccess({ id: match.id });
  } catch (e) {
    console.error("Delete match error:", e);
    return apiError("删除比赛失败", 500);
  }
});
