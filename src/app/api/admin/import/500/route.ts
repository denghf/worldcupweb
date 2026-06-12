import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

// --- Constants ---

const BASE_URL = "https://trade.500.com/jczq/";
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "zh-CN,zh;q=0.9",
};

const HALF_FULL_LABELS: Record<string, string> = {
  "3-3": "胜胜", "3-1": "胜平", "3-0": "胜负",
  "1-3": "平胜", "1-1": "平平", "1-0": "平负",
  "0-3": "负胜", "0-1": "负平", "0-0": "负负",
};

const TEAM_ALIASES: Record<string, string> = {
  "沙特阿拉伯": "沙特",
  "乌兹别克": "乌兹别克斯坦",
  "刚果(金)": "刚果（金）",
};

// --- Helpers ---

function canonicalTeam(name: string): string {
  const n = name.trim().replace(/\s+/g, "").replace(/\(/g, "（").replace(/\)/g, "）");
  return TEAM_ALIASES[n] ?? n;
}

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

function getTodayShanghai(): string {
  const now = new Date();
  const shanghai = new Date(now.getTime() + 8 * 3600 * 1000);
  return `${shanghai.getUTCFullYear()}-${String(shanghai.getUTCMonth() + 1).padStart(2, "0")}-${String(shanghai.getUTCDate()).padStart(2, "0")}`;
}

// --- Fetch ---

async function fetchPage(playid: number, date: string): Promise<string> {
  const url = `${BASE_URL}?playid=${playid}&g=2&date=${date}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch playid=${playid}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return new TextDecoder("gb18030").decode(buf);
}

// --- Parse ---

interface ParsedOdds {
  betType: "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE";
  optionKey: string;
  oddsValue: number;
}

interface ParsedMatch {
  apiMatchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  handicap: number | null;
  odds: ParsedOdds[];
}

function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  for (const match of tag.matchAll(re)) {
    attrs[match[1]] = match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function extractMatchBlocks(html: string) {
  const starts = [...html.matchAll(/<tr\b[^>]*\bdata-matchnum\s*=\s*"([^"]+)"[^>]*>/g)].map((m) => ({
    index: m.index!,
    tag: m[0],
    matchNo: m[1],
  }));
  return starts.map((start, i) => ({
    matchNo: start.matchNo,
    attrs: parseAttrs(start.tag),
    block: html.slice(start.index, starts[i + 1]?.index ?? html.length),
  }));
}

function extractOdds(block: string) {
  const tags = block.match(/<[^>]+\bdata-value\s*=\s*(?:"[^"]*"|'[^']*')[^>]+\bdata-sp\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>/g) ?? [];
  return tags
    .map(parseAttrs)
    .filter((a) => a["data-type"] && a["data-value"] && a["data-sp"] && !Number.isNaN(Number(a["data-sp"])));
}

function mapX1xValue(value: string): string | null {
  if (value === "3") return "home";
  if (value === "1") return "draw";
  if (value === "0") return "away";
  return null;
}

function parseHandicap(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseKickoff(matchDate: string, matchTime: string): string | null {
  if (!matchDate || !matchTime) return null;
  return `${matchDate}T${matchTime}:00+08:00`;
}

function buildMatches(baseBlocks: ReturnType<typeof extractMatchBlocks>): Map<string, ParsedMatch> {
  const matches = new Map<string, ParsedMatch>();

  for (const block of baseBlocks) {
    const homeTeam = block.attrs["data-homesxname"];
    const awayTeam = block.attrs["data-awaysxname"];
    const kickoffTime = parseKickoff(block.attrs["data-matchdate"], block.attrs["data-matchtime"]);
    if (!homeTeam || !awayTeam || !kickoffTime) continue;

    const handicap = parseHandicap(block.attrs["data-rangqiu"]);
    const odds: ParsedOdds[] = [];

    for (const odd of extractOdds(block.block)) {
      const type = odd["data-type"];
      const value = odd["data-value"];
      const oddsValue = Number(odd["data-sp"]);
      const key = mapX1xValue(value);
      if (!key) continue;
      if (type === "nspf") {
        odds.push({ betType: "X1X", optionKey: key, oddsValue });
      } else if (type === "spf" && handicap !== null) {
        odds.push({ betType: "HANDICAP_X1X", optionKey: `${handicap}:${key}`, oddsValue });
      }
    }

    matches.set(block.matchNo, { apiMatchId: `500-${block.matchNo}`, homeTeam, awayTeam, kickoffTime, handicap, odds });
  }

  return matches;
}

function addTotalGoals(matches: Map<string, ParsedMatch>, blocks: ReturnType<typeof extractMatchBlocks>) {
  for (const block of blocks) {
    const match = matches.get(block.matchNo);
    if (!match) continue;
    for (const odd of extractOdds(block.block)) {
      if (odd["data-type"] !== "jqs") continue;
      const raw = odd["data-value"];
      match.odds.push({ betType: "TOTAL_GOALS", optionKey: raw === "7" ? "7+" : `${raw}球`, oddsValue: Number(odd["data-sp"]) });
    }
  }
}

function addCorrectScores(matches: Map<string, ParsedMatch>, blocks: ReturnType<typeof extractMatchBlocks>) {
  for (const block of blocks) {
    const match = matches.get(block.matchNo);
    if (!match) continue;
    for (const odd of extractOdds(block.block)) {
      if (odd["data-type"] !== "bf") continue;
      match.odds.push({ betType: "CORRECT_SCORE", optionKey: odd["data-value"], oddsValue: Number(odd["data-sp"]) });
    }
  }
}

function addHalfFull(matches: Map<string, ParsedMatch>, blocks: ReturnType<typeof extractMatchBlocks>) {
  for (const block of blocks) {
    const match = matches.get(block.matchNo);
    if (!match) continue;
    for (const odd of extractOdds(block.block)) {
      if (odd["data-type"] !== "bqc") continue;
      const optionKey = HALF_FULL_LABELS[odd["data-value"]];
      if (!optionKey) continue;
      match.odds.push({ betType: "HALF_FULL", optionKey, oddsValue: Number(odd["data-sp"]) });
    }
  }
}

function dedupeOdds(odds: ParsedOdds[]): ParsedOdds[] {
  const seen = new Set<string>();
  return odds.filter((o) => {
    const key = `${o.betType}:${o.optionKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- Main handler ---

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const date = (body as { date?: string }).date || getTodayShanghai();

    const pages = await Promise.all([
      fetchPage(269, date),
      fetchPage(270, date),
      fetchPage(271, date),
      fetchPage(272, date),
    ]);

    const baseBlocks = extractMatchBlocks(pages[0]);
    const totalGoalBlocks = extractMatchBlocks(pages[1]);
    const correctScoreBlocks = extractMatchBlocks(pages[2]);
    const halfFullBlocks = extractMatchBlocks(pages[3]);

    const matchesMap = buildMatches(baseBlocks);
    addTotalGoals(matchesMap, totalGoalBlocks);
    addCorrectScores(matchesMap, correctScoreBlocks);
    addHalfFull(matchesMap, halfFullBlocks);

    const fetchedMatches = [...matchesMap.values()];
    for (const m of fetchedMatches) m.odds = dedupeOdds(m.odds);

    if (fetchedMatches.length === 0) {
      return apiSuccess({ fetched: 0, updated: 0, created: 0, message: "当天没有可抓取的比赛" });
    }

    // Build fuzzy index for matching
    const apiMatchIds = fetchedMatches.map((m) => m.apiMatchId);
    const existingByApiId = await prisma.match.findMany({
      where: { apiMatchId: { in: apiMatchIds } },
      select: { id: true, apiMatchId: true },
    });
    const existingMap = new Map(existingByApiId.map((m) => [m.apiMatchId, m]));

    const allExisting = await prisma.match.findMany({
      select: { id: true, apiMatchId: true, homeTeam: true, awayTeam: true, kickoffTime: true },
    });
    const fuzzyIndex = new Map<string, (typeof allExisting)[number]>();
    for (const m of allExisting) {
      const key = `${dateKey(m.kickoffTime)}:${canonicalTeam(m.homeTeam)}:${canonicalTeam(m.awayTeam)}`;
      if (!fuzzyIndex.has(key)) fuzzyIndex.set(key, m);
    }

    let updated = 0;
    let created = 0;

    for (const m of fetchedMatches) {
      const kickoff = new Date(m.kickoffTime);
      const uniqueOdds = m.odds;

      const existing = existingMap.get(m.apiMatchId);
      const fuzzyKey = `${dateKey(kickoff)}:${canonicalTeam(m.homeTeam)}:${canonicalTeam(m.awayTeam)}`;
      const fuzzyMatch = !existing ? fuzzyIndex.get(fuzzyKey) : null;
      const target = existing ?? fuzzyMatch;

      if (target) {
        await prisma.$transaction(async (tx) => {
          await tx.match.update({
            where: { id: target.id },
            data: { kickoffTime: kickoff, oddsUpdatedAt: new Date() },
          });
          await tx.odds.deleteMany({ where: { matchId: target.id } });
          if (uniqueOdds.length) {
            await tx.odds.createMany({
              data: uniqueOdds.map((o) => ({
                matchId: target.id,
                betType: o.betType,
                optionKey: o.optionKey,
                oddsValue: o.oddsValue,
              })),
            });
          }
        });
        updated++;
      } else {
        // Find tournament for new matches (use tournamentId 1 as default world cup)
        const match = await prisma.match.create({
          data: {
            tournamentId: 1,
            apiMatchId: m.apiMatchId,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            kickoffTime: kickoff,
            status: "UPCOMING",
            oddsUpdatedAt: new Date(),
          },
        });
        if (uniqueOdds.length) {
          await prisma.odds.createMany({
            data: uniqueOdds.map((o) => ({
              matchId: match.id,
              betType: o.betType,
              optionKey: o.optionKey,
              oddsValue: o.oddsValue,
            })),
          });
        }
        created++;
      }
    }

    return apiSuccess({ fetched: fetchedMatches.length, updated, created });
  } catch (e) {
    console.error("500.com import error:", e);
    return apiError("抓取失败: " + (e instanceof Error ? e.message : String(e)), 500);
  }
});
