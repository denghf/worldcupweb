import { prisma } from "@/lib/db";
import { settleMatchResult } from "@/lib/match-settlement";
import { getTodayShanghai } from "@/lib/import-500-odds";

const BASE_URL = "https://zx.500.com/jczq/kaijiang.php";
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const TEAM_ALIASES: Record<string, string> = {
  "沙特": "沙特阿拉伯",
  "乌兹别克": "乌兹别克斯坦",
  "刚果(金)": "刚果（金）",
  "民主刚果": "刚果（金）",
};

interface ParsedResult {
  matchNo: string;
  competition: string;
  kickoffDate: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  halfHomeScore: number;
  halfAwayScore: number;
}

export interface Import500ResultsItem {
  matchNo: string;
  apiMatchId: string;
  matchId?: number;
  homeTeam: string;
  awayTeam: string;
  kickoffDate: string;
  homeScore: number;
  awayScore: number;
  halfHomeScore: number;
  halfAwayScore: number;
  action: "settled" | "skipped";
  matchedBy: "apiMatchId" | "fuzzy" | "none";
  reason?: "no_matching_match" | "already_finished_without_pending_items";
}

export interface Import500ResultsSummary {
  fetched: number;
  settled: number;
  skipped: number;
  items: Import500ResultsItem[];
  message?: string;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalTeam(name: string): string {
  const n = name.trim().replace(/\s+/g, "").replace(/\(/g, "（").replace(/\)/g, "）");
  return TEAM_ALIASES[n] ?? n;
}

function getShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getResultDate(importDate: string, monthDay: string) {
  const [importYear, importMonth] = importDate.split("-").map(Number);
  const [month, day] = monthDay.split("-").map(Number);
  const year = importMonth === 12 && month === 1 ? importYear + 1 : importMonth === 1 && month === 12 ? importYear - 1 : importYear;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseResults(html: string, importDate: string): ParsedResult[] {
  const results: ParsedResult[] = [];
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (const row of rows) {
    const text = stripHtml(row[1]);
    const m = text.match(/^(周[一二三四五六日]\d{3})\s+(\S+)\s+(\d{2}-\d{2})\s+\d{2}:\d{2}\s+(\S+)\s+[+-]?\d+\s+(\S+)\s+\((\d+):(\d+)\)\s+(\d+):(\d+)/);
    if (m) {
      results.push({
        matchNo: m[1],
        competition: m[2],
        kickoffDate: getResultDate(importDate, m[3]),
        homeTeam: m[4],
        awayTeam: m[5],
        halfHomeScore: Number(m[6]),
        halfAwayScore: Number(m[7]),
        homeScore: Number(m[8]),
        awayScore: Number(m[9]),
      });
    }
  }

  return results;
}

export async function import500Results(date = getTodayShanghai()): Promise<Import500ResultsSummary> {
  const res = await fetch(`${BASE_URL}?d=${date}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`抓取失败: HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const html = new TextDecoder("gb18030").decode(buf);
  const results = parseResults(html, date).filter((result) => result.competition === "世界杯");

  if (results.length === 0) {
    return { fetched: 0, settled: 0, skipped: 0, items: [], message: "当天没有已开奖的比赛" };
  }

  const apiMatchIds = results.map((r) => `500-${r.matchNo}`);
  const existingByApiId = await prisma.match.findMany({
    where: { apiMatchId: { in: apiMatchIds } },
    select: { id: true, apiMatchId: true, status: true },
  });
  const apiIdMap = new Map(existingByApiId.map((m) => [m.apiMatchId, m]));

  const unmatched = results.filter((r) => !apiIdMap.has(`500-${r.matchNo}`));
  const fuzzyMatches: Map<string, { id: number; status: string }> = new Map();

  if (unmatched.length > 0) {
    const allMatches = await prisma.match.findMany({
      select: { id: true, apiMatchId: true, homeTeam: true, awayTeam: true, kickoffTime: true, status: true },
    });
    for (const r of unmatched) {
      const found = allMatches.find((m) =>
        canonicalTeam(m.homeTeam) === canonicalTeam(r.homeTeam) &&
        canonicalTeam(m.awayTeam) === canonicalTeam(r.awayTeam) &&
        getShanghaiDate(m.kickoffTime) === r.kickoffDate
      );
      if (found) fuzzyMatches.set(r.matchNo, found);
    }
  }

  let settled = 0;
  let skipped = 0;
  const items: Import500ResultsItem[] = [];

  for (const r of results) {
    const apiMatchId = `500-${r.matchNo}`;
    const byApiId = apiIdMap.get(apiMatchId);
    const byFuzzy = fuzzyMatches.get(r.matchNo);
    const match = byApiId ?? byFuzzy;
    const baseItem = {
      matchNo: r.matchNo,
      apiMatchId,
      homeTeam: r.homeTeam,
      awayTeam: r.awayTeam,
      kickoffDate: r.kickoffDate,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
      halfHomeScore: r.halfHomeScore,
      halfAwayScore: r.halfAwayScore,
    };

    if (!match) {
      skipped++;
      items.push({ ...baseItem, action: "skipped", matchedBy: "none", reason: "no_matching_match" });
      continue;
    }

    const matchedBy = byApiId ? "apiMatchId" : "fuzzy";
    if (match.status === "FINISHED") {
      const pendingItems = await prisma.betItem.count({ where: { matchId: match.id, result: "PENDING" } });
      if (pendingItems === 0) {
        skipped++;
        items.push({ ...baseItem, matchId: match.id, action: "skipped", matchedBy, reason: "already_finished_without_pending_items" });
        continue;
      }
    }

    await settleMatchResult({
      matchId: match.id,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
      halfHomeScore: r.halfHomeScore,
      halfAwayScore: r.halfAwayScore,
      finalHomeScore: r.homeScore,
      finalAwayScore: r.awayScore,
      allowResettle: false,
    });
    settled++;
    items.push({ ...baseItem, matchId: match.id, action: "settled", matchedBy });
  }

  return { fetched: results.length, settled, skipped, items };
}
