import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";
import { fetchOdds } from "@/lib/api-football";

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const {
      tournamentId,
      fixtureId,
      homeTeam,
      awayTeam,
      homeTeamLogo,
      awayTeamLogo,
      kickoffTime,
    } = await req.json();

    if (!tournamentId || !fixtureId || !homeTeam || !awayTeam || !kickoffTime) {
      return apiError("缺少必要参数");
    }

    // Create or update match
    const match = await prisma.match.upsert({
      where: { apiMatchId: String(fixtureId) },
      update: {
        tournamentId: Number(tournamentId),
        homeTeam,
        awayTeam,
        homeTeamLogo: homeTeamLogo || null,
        awayTeamLogo: awayTeamLogo || null,
        kickoffTime: new Date(kickoffTime),
        status: "UPCOMING",
        oddsUpdatedAt: new Date(),
      },
      create: {
        tournamentId: Number(tournamentId),
        apiMatchId: String(fixtureId),
        homeTeam,
        awayTeam,
        homeTeamLogo: homeTeamLogo || null,
        awayTeamLogo: awayTeamLogo || null,
        kickoffTime: new Date(kickoffTime),
        status: "UPCOMING",
        oddsUpdatedAt: new Date(),
      },
    });

    // Fetch odds
    let oddsCreated = 0;
    try {
      const oddsData = await fetchOdds(Number(fixtureId));
      if (oddsData.length > 0) {
        const bookmaker = oddsData[0].bookmakers[0];
        if (bookmaker) {
          for (const bet of bookmaker.bets) {
            for (const val of bet.values) {
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
                  oddsCreated++;
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
                oddsCreated++;
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
                oddsCreated++;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`Failed to fetch odds for fixture ${fixtureId}:`, e);
    }

    return apiSuccess({ match, oddsCreated });
  } catch (e) {
    console.error("Import match error:", e);
    return apiError("导入失败：" + (e instanceof Error ? e.message : "未知错误"), 500);
  }
});
