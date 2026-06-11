#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const { TextDecoder } = require("util");

const BASE_URL = "https://trade.500.com/jczq/";
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "zh-CN,zh;q=0.9",
};

const HALF_FULL_LABELS = {
  "3-3": "胜胜",
  "3-1": "胜平",
  "3-0": "胜负",
  "1-3": "平胜",
  "1-1": "平平",
  "1-0": "平负",
  "0-3": "负胜",
  "0-1": "负平",
  "0-0": "负负",
};

function usage() {
  console.error("Usage: node scripts/fetch_500.js YYYY-MM-DD [--out json/YYYYMMDD.json]");
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const date = args[0];
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    usage();
    process.exit(1);
  }

  let outPath = null;
  for (let i = 1; i < args.length; i += 1) {
    if (args[i] === "--out" || args[i] === "-o") {
      outPath = args[i + 1];
      i += 1;
    } else {
      console.error(`Unknown argument: ${args[i]}`);
      usage();
      process.exit(1);
    }
  }

  return { date, outPath };
}

function decodeHtml(buffer) {
  return new TextDecoder("gb18030").decode(buffer);
}

async function fetchPage(playid, date) {
  const url = `${BASE_URL}?playid=${playid}&g=2&date=${date}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch playid=${playid}: HTTP ${response.status}`);
  }
  return decodeHtml(Buffer.from(await response.arrayBuffer()));
}

function htmlText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAttrs(tag) {
  const attrs = {};
  const re = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  for (const match of tag.matchAll(re)) {
    attrs[match[1]] = match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function extractMatchBlocks(html) {
  const starts = [...html.matchAll(/<tr\b[^>]*\bdata-matchnum\s*=\s*"([^"]+)"[^>]*>/g)].map((match) => ({
    index: match.index,
    tag: match[0],
    matchNo: match[1],
  }));

  return starts.map((start, index) => ({
    matchNo: start.matchNo,
    attrs: parseAttrs(start.tag),
    block: html.slice(start.index, starts[index + 1]?.index ?? html.length),
  }));
}

function extractOdds(block) {
  const tags = block.match(/<[^>]+\bdata-value\s*=\s*(?:"[^"]*"|'[^']*')[^>]+\bdata-sp\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>/g) ?? [];
  return tags
    .map(parseAttrs)
    .filter((attrs) => attrs["data-type"] && attrs["data-value"] && attrs["data-sp"] && !Number.isNaN(Number(attrs["data-sp"])));
}

function getCells(block) {
  return [...block.matchAll(/<td\b[^>]*>[\s\S]*?<\/td>/gi)].map((match) => htmlText(match[0]));
}

function parseHandicap(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseKickoff(matchDate, matchTime) {
  if (!matchDate || !matchTime) return null;
  return `${matchDate}T${matchTime}:00+08:00`;
}

function makeMatch(block) {
  const homeTeam = block.attrs["data-homesxname"];
  const awayTeam = block.attrs["data-awaysxname"];
  const kickoffTime = parseKickoff(block.attrs["data-matchdate"], block.attrs["data-matchtime"]);
  if (!homeTeam || !awayTeam || !kickoffTime) {
    const cells = getCells(block.block);
    throw new Error(`Cannot parse base match info for ${block.matchNo}: ${cells.join(" | ")}`);
  }

  return {
    apiMatchId: `500-${block.matchNo}`,
    matchNo: block.matchNo,
    homeTeam,
    awayTeam,
    kickoffTime,
    handicap: parseHandicap(block.attrs["data-rangqiu"]),
    odds: [],
  };
}

function mapX1xValue(value) {
  if (value === "3") return "home";
  if (value === "1") return "draw";
  if (value === "0") return "away";
  return null;
}

function addBaseOdds(matches, blocks) {
  for (const block of blocks) {
    const match = makeMatch(block);
    const odds = extractOdds(block.block);

    for (const odd of odds) {
      const type = odd["data-type"];
      const value = odd["data-value"];
      const oddsValue = Number(odd["data-sp"]);
      const key = mapX1xValue(value);
      if (!key) continue;

      if (type === "nspf") {
        match.odds.push({ betType: "X1X", optionKey: key, oddsValue });
      } else if (type === "spf" && match.handicap !== null) {
        match.odds.push({ betType: "HANDICAP_X1X", optionKey: `${match.handicap}:${key}`, oddsValue });
      }
    }

    matches.set(block.matchNo, match);
  }
}

function addTotalGoals(matches, blocks) {
  for (const block of blocks) {
    const match = matches.get(block.matchNo);
    if (!match) continue;

    for (const odd of extractOdds(block.block)) {
      if (odd["data-type"] !== "jqs") continue;
      const raw = odd["data-value"];
      const optionKey = raw === "7" ? "7+" : `${raw}球`;
      match.odds.push({ betType: "TOTAL_GOALS", optionKey, oddsValue: Number(odd["data-sp"]) });
    }
  }
}

function addCorrectScores(matches, blocks) {
  for (const block of blocks) {
    const match = matches.get(block.matchNo);
    if (!match) continue;

    for (const odd of extractOdds(block.block)) {
      if (odd["data-type"] !== "bf") continue;
      match.odds.push({ betType: "CORRECT_SCORE", optionKey: odd["data-value"], oddsValue: Number(odd["data-sp"]) });
    }
  }
}

function addHalfFull(matches, blocks) {
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

function dedupeOdds(match) {
  const seen = new Set();
  match.odds = match.odds.filter((odd) => {
    const key = `${odd.betType}:${odd.optionKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarize(matches) {
  const byType = {};
  let total = 0;
  for (const match of matches) {
    total += match.odds.length;
    for (const odd of match.odds) {
      byType[odd.betType] = (byType[odd.betType] ?? 0) + 1;
    }
  }
  return { total, byType };
}

async function run(date, outPathArg) {
  console.log(`Fetching 500.com data for ${date}...`);

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

  console.log(`  269 base matches: ${baseBlocks.length}`);
  console.log(`  270 total goals matches: ${totalGoalBlocks.length}`);
  console.log(`  271 correct score matches: ${correctScoreBlocks.length}`);
  console.log(`  272 half/full matches: ${halfFullBlocks.length}`);

  const matchesByNo = new Map();
  addBaseOdds(matchesByNo, baseBlocks);
  addTotalGoals(matchesByNo, totalGoalBlocks);
  addCorrectScores(matchesByNo, correctScoreBlocks);
  addHalfFull(matchesByNo, halfFullBlocks);

  const matches = [...matchesByNo.values()];
  for (const match of matches) dedupeOdds(match);

  const outPath = outPathArg ?? path.join("json", `${date.replaceAll("-", "")}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(matches, null, 2)}\n`, "utf8");

  const summary = summarize(matches);
  console.log(`Saved ${matches.length} matches with ${summary.total} odds to ${outPath}`);
  console.log(`  ${JSON.stringify(summary.byType)}`);
}

const { date, outPath } = parseArgs(process.argv);
run(date, outPath).catch((error) => {
  console.error(error);
  process.exit(1);
});
