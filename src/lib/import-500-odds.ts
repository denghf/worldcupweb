import { prisma } from "@/lib/db";
import { BEIJING_DEDUP_MIN_DATE, canonicalTeam, getBeijingDateKey } from "@/lib/beijing-time";
import { mergeDuplicateMatches, type MergeSummary } from "@/lib/match-merge";

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

interface ParsedOdds {
  betType: "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE";
  optionKey: string;
  oddsValue: number;
}

interface ParsedMatch {
  matchNo: string;
  apiMatchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  handicap: number | null;
  odds: ParsedOdds[];
}

export interface Import500OddsItem {
  matchNo: string;
  apiMatchId: string;
  matchId?: number;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  handicap: number | null;
  action: "updated" | "created";
  matchedBy: "apiMatchId" | "fuzzy" | "created";
  marketCounts: Partial<Record<ParsedOdds["betType"], number>>;
  oddsCount: number;
}

export interface Import500OddsSummary {
  fetched: number;
  updated: number;
  created: number;
  items: Import500OddsItem[];
  message?: string;
  merge?: MergeSummary;
}

export function getTodayShanghai(): string {
  const now = new Date();
  const shanghai = new Date(now.getTime() + 8 * 3600 * 1000);
  return `${shanghai.getUTCFullYear()}-${String(shanghai.getUTCMonth() + 1).padStart(2, "0")}-${String(shanghai.getUTCDate()).padStart(2, "0")}`;
}

async function fetchPage(playid: number, date: string): Promise<string> {
  const url = `${BASE_URL}?playid=${playid}&g=2&date=${date}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch playid=${playid}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return new TextDecoder("gb18030").decode(buf);
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
    if (block.attrs["data-simpleleague"] !== "世界杯") continue;
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

    matches.set(block.matchNo, { matchNo: block.matchNo, apiMatchId: `500-${block.matchNo}`, homeTeam, awayTeam, kickoffTime, handicap, odds });
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

function countMarkets(odds: ParsedOdds[]) {
  return odds.reduce<Import500OddsItem["marketCounts"]>((acc, odd) => {
    acc[odd.betType] = (acc[odd.betType] ?? 0) + 1;
    return acc;
  }, {});
}

export async function import500Odds(date = getTodayShanghai()): Promise<Import500OddsSummary> {
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
    return { fetched: 0, updated: 0, created: 0, items: [], message: "当天没有可抓取的比赛" };
  }

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
    const key = `${getBeijingDateKey(m.kickoffTime)}:${canonicalTeam(m.homeTeam)}:${canonicalTeam(m.awayTeam)}`;
    if (!fuzzyIndex.has(key)) fuzzyIndex.set(key, m);
  }

  let updated = 0;
  let created = 0;
  const items: Import500OddsItem[] = [];

  for (const m of fetchedMatches) {
    const kickoff = new Date(m.kickoffTime);
    const uniqueOdds = m.odds;

    const existing = existingMap.get(m.apiMatchId);
    const fuzzyKey = `${getBeijingDateKey(kickoff)}:${canonicalTeam(m.homeTeam)}:${canonicalTeam(m.awayTeam)}`;
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
      items.push({
        matchNo: m.matchNo,
        apiMatchId: m.apiMatchId,
        matchId: target.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        kickoffTime: m.kickoffTime,
        handicap: m.handicap,
        action: "updated",
        matchedBy: existing ? "apiMatchId" : "fuzzy",
        marketCounts: countMarkets(uniqueOdds),
        oddsCount: uniqueOdds.length,
      });
    } else {
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
      items.push({
        matchNo: m.matchNo,
        apiMatchId: m.apiMatchId,
        matchId: match.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        kickoffTime: m.kickoffTime,
        handicap: m.handicap,
        action: "created",
        matchedBy: "created",
        marketCounts: countMarkets(uniqueOdds),
        oddsCount: uniqueOdds.length,
      });
    }
  }

  let merge: MergeSummary | undefined;
  try {
    merge = await mergeDuplicateMatches({ minDate: BEIJING_DEDUP_MIN_DATE });
  } catch (e) {
    console.error("[import-500-odds] mergeDuplicateMatches failed", e);
  }

  return { fetched: fetchedMatches.length, updated, created, items, merge };
}
