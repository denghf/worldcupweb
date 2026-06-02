import { NextRequest } from "next/server";
import { fetchFixtures, fetchFixturesByDate, type ApiFixture } from "@/lib/api-football";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get("leagueId");
    const season = searchParams.get("season");
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!leagueId && !date) {
      return apiError("联赛ID或日期至少填一个");
    }

    let fixtures: ApiFixture[];
    if (leagueId && season) {
      fixtures = await fetchFixtures(Number(leagueId), season, {
        date: date || undefined,
        from: from || undefined,
        to: to || undefined,
      });
    } else if (date) {
      fixtures = await fetchFixturesByDate(date);
    } else {
      return apiError("参数不足");
    }

    // Only return upcoming / not finished matches
    const upcoming = fixtures.filter(
      (f) => !["FT", "AET", "PEN", "AWD", "WO"].includes(f.fixture.status.short)
    );

    return apiSuccess(
      upcoming.map((f) => ({
        fixtureId: f.fixture.id,
        date: f.fixture.date,
        status: f.fixture.status.short,
        league: f.league,
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeTeamLogo: f.teams.home.logo,
        awayTeamLogo: f.teams.away.logo,
      }))
    );
  } catch (e) {
    console.error("Import fixtures error:", e);
    return apiError("获取赛程失败：" + (e instanceof Error ? e.message : "未知错误"), 500);
  }
});
