import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { fetchFixtures, fetchOdds } from "@/lib/api-football";

// 每天拉取次日比赛赔率，锁定后不再更新
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return apiError("Forbidden", 403);
  }

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    const activeTournaments = await prisma.tournament.findMany({
      where: { status: "ACTIVE" },
    });

    let totalMatches = 0;

    for (const tournament of activeTournaments) {
      const fixtures = await fetchFixtures(
        tournament.leagueId,
        tournament.season,
        { date: dateStr }
      );

      for (const fixture of fixtures) {
        const matchData = {
          tournamentId: tournament.id,
          apiMatchId: String(fixture.fixture.id),
          homeTeam: fixture.teams.home.name,
          awayTeam: fixture.teams.away.name,
          homeTeamLogo: fixture.teams.home.logo,
          awayTeamLogo: fixture.teams.away.logo,
          kickoffTime: new Date(fixture.fixture.date),
          oddsUpdatedAt: new Date(),
        };

        const match = await prisma.match.upsert({
          where: { apiMatchId: String(fixture.fixture.id) },
          update: matchData,
          create: matchData,
        });

        // 拉取赔率
        try {
          const oddsData = await fetchOdds(fixture.fixture.id);
          if (oddsData.length > 0) {
            const bookmaker = oddsData[0].bookmakers[0];
            if (bookmaker) {
              for (const bet of bookmaker.bets) {
                for (const val of bet.values) {
                  // 只处理 Match Winner (1X2) 和 Correct Score
                  if (bet.name === "Match Winner") {
                    const optionMap: Record<string, string> = {
                      Home: "home",
                      Draw: "draw",
                      Away: "away",
                    };
                    const key = optionMap[val.value];
                    if (key) {
                      await prisma.odds.upsert({
                        where: {
                          matchId_betType_optionKey: {
                            matchId: match.id,
                            betType: "X1X",
                            optionKey: key,
                          },
                        },
                        update: { oddsValue: val.odd },
                        create: {
                          matchId: match.id,
                          betType: "X1X",
                          optionKey: key,
                          oddsValue: val.odd,
                        },
                      });
                    }
                  }

                  if (bet.name === "Correct Score") {
                    const normalizedKey = val.value.replace("-", ":");
                    await prisma.odds.upsert({
                      where: {
                        matchId_betType_optionKey: {
                          matchId: match.id,
                          betType: "CORRECT_SCORE",
                          optionKey: normalizedKey,
                        },
                      },
                      update: { oddsValue: val.odd },
                      create: {
                        matchId: match.id,
                        betType: "CORRECT_SCORE",
                        optionKey: normalizedKey,
                        oddsValue: val.odd,
                      },
                    });
                  }

                  if (bet.name === "Goals Over/Under") {
                    await prisma.odds.upsert({
                      where: {
                        matchId_betType_optionKey: {
                          matchId: match.id,
                          betType: "TOTAL_GOALS",
                          optionKey: val.value,
                        },
                      },
                      update: { oddsValue: val.odd },
                      create: {
                        matchId: match.id,
                        betType: "TOTAL_GOALS",
                        optionKey: val.value,
                        oddsValue: val.odd,
                      },
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error(`Failed to fetch odds for fixture ${fixture.fixture.id}:`, e);
        }

        totalMatches++;
      }
    }

    return apiSuccess({ date: dateStr, matchesProcessed: totalMatches });
  } catch (e) {
    console.error("Cron odds error:", e);
    return apiError("赔率拉取失败", 500);
  }
}
