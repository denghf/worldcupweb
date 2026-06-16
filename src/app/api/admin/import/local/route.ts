import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

interface OddsInput {
  betType: string;
  optionKey: string;
  oddsValue: number;
}

interface MatchInput {
  apiMatchId: string;
  matchNo?: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  handicap?: number;
  odds: OddsInput[];
}

const TEAM_ALIASES: Record<string, string> = {
  "沙特": "沙特阿拉伯",
  "乌兹别克": "乌兹别克斯坦",
  "刚果(金)": "刚果（金）",
};

function canonicalTeam(name: string): string {
  const n = name.trim().replace(/\s+/g, "").replace(/\(/g, "（").replace(/\)/g, "）");
  return TEAM_ALIASES[n] ?? n;
}

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { tournamentId, matches } = await req.json();

    if (!tournamentId) return apiError("请选择赛事");
    if (!Array.isArray(matches) || matches.length === 0) return apiError("比赛数据不能为空");

    const tournament = await prisma.tournament.findUnique({ where: { id: Number(tournamentId) } });
    if (!tournament) return apiError("赛事不存在");

    // Find existing matches by apiMatchId
    const apiMatchIds = matches.map((m: MatchInput) => m.apiMatchId);
    const existingByApiId = await prisma.match.findMany({
      where: { apiMatchId: { in: apiMatchIds } },
      select: { id: true, apiMatchId: true },
    });
    const existingMap = new Map(existingByApiId.map((m) => [m.apiMatchId, m]));

    // Find existing matches by team pair + date for fuzzy matching
    const allExisting = await prisma.match.findMany({
      select: { id: true, apiMatchId: true, homeTeam: true, awayTeam: true, kickoffTime: true },
    });
    const fuzzyIndex = new Map<string, typeof allExisting[number]>();
    for (const m of allExisting) {
      const key = `${dateKey(m.kickoffTime)}:${canonicalTeam(m.homeTeam)}:${canonicalTeam(m.awayTeam)}`;
      if (!fuzzyIndex.has(key)) fuzzyIndex.set(key, m);
    }

    let imported = 0;
    let updated = 0;

    for (const m of matches as MatchInput[]) {
      if (!m.apiMatchId || !m.homeTeam || !m.awayTeam || !m.kickoffTime) continue;

      // Deduplicate odds
      const seen = new Set<string>();
      const uniqueOdds = (m.odds ?? []).filter((o) => {
        const key = `${o.betType}:${o.optionKey}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Try exact match by apiMatchId first, then fuzzy match by team + date
      const existing = existingMap.get(m.apiMatchId);
      const kickoff = new Date(m.kickoffTime);
      const fuzzyKey = `${dateKey(kickoff)}:${canonicalTeam(m.homeTeam)}:${canonicalTeam(m.awayTeam)}`;
      const fuzzyMatch = !existing ? fuzzyIndex.get(fuzzyKey) : null;

      const target = existing ?? fuzzyMatch;

      if (target) {
        // Update existing match
        await prisma.$transaction(async (tx) => {
          await tx.match.update({
            where: { id: target.id },
            data: {
              kickoffTime: kickoff,
              oddsUpdatedAt: uniqueOdds.length ? new Date() : null,
            },
          });
          await tx.odds.deleteMany({ where: { matchId: target.id } });
          if (uniqueOdds.length) {
            await tx.odds.createMany({
              data: uniqueOdds.map((o) => ({
                matchId: target.id,
                betType: o.betType as "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE",
                optionKey: o.optionKey,
                oddsValue: o.oddsValue,
              })),
            });
          }
        });
        updated++;
      } else {
        // Create new match
        const match = await prisma.match.create({
          data: {
            tournamentId: tournament.id,
            apiMatchId: m.apiMatchId,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            kickoffTime: kickoff,
            status: "UPCOMING",
            oddsUpdatedAt: uniqueOdds.length ? new Date() : null,
          },
        });
        if (uniqueOdds.length) {
          await prisma.odds.createMany({
            data: uniqueOdds.map((o) => ({
              matchId: match.id,
              betType: o.betType as "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE",
              optionKey: o.optionKey,
              oddsValue: o.oddsValue,
            })),
          });
        }
      }

      imported++;
    }

    return apiSuccess({ imported, updated, created: imported - updated });
  } catch (e) {
    console.error("Local import error:", e);
    return apiError("导入失败: " + (e instanceof Error ? e.message : String(e)), 500);
  }
});
