#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const VALID_BET_TYPES = new Set(["X1X", "HANDICAP_X1X", "HALF_FULL", "TOTAL_GOALS", "CORRECT_SCORE"]);

function usage() {
  console.error("Usage: node scripts/import_json.js [--file json/20260611.json] [--tournament-id 1] [--dry-run]");
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = {
    file: "json/20260611.json",
    tournamentId: 1,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--file" || arg === "-f") {
      parsed.file = args[i + 1];
      i += 1;
    } else if (arg === "--tournament-id" || arg === "-t") {
      parsed.tournamentId = Number(args[i + 1]);
      i += 1;
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else {
      console.error(`Unknown argument: ${arg}`);
      usage();
      process.exit(1);
    }
  }

  if (!parsed.file || !Number.isInteger(parsed.tournamentId)) {
    usage();
    process.exit(1);
  }

  return parsed;
}

function canonicalTeamName(name) {
  const normalized = String(name)
    .trim()
    .replace(/\s+/g, "")
    .replace(/\(/g, "（")
    .replace(/\)/g, "）");

  const aliases = {
    "刚果（金）": "刚果（金）",
    沙特阿拉伯: "沙特",
    乌兹别克: "乌兹别克斯坦",
  };

  return aliases[normalized] ?? normalized;
}

function matchKey(match) {
  return `${new Date(match.kickoffTime).getTime()}:${canonicalTeamName(match.homeTeam)}:${canonicalTeamName(match.awayTeam)}`;
}

function kickoffKey(date) {
  return new Date(date).getTime();
}

function readMatches(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("JSON root must be a non-empty array");
  }
  return data;
}

function validateMatch(match, index) {
  const prefix = `match[${index}]`;
  for (const key of ["apiMatchId", "homeTeam", "awayTeam", "kickoffTime", "odds"]) {
    if (!(key in match)) throw new Error(`${prefix} missing ${key}`);
  }
  if (!Number.isFinite(new Date(match.kickoffTime).getTime())) {
    throw new Error(`${prefix} invalid kickoffTime: ${match.kickoffTime}`);
  }
  if (!Array.isArray(match.odds)) {
    throw new Error(`${prefix} odds must be an array`);
  }

  const seen = new Set();
  for (let i = 0; i < match.odds.length; i += 1) {
    const odd = match.odds[i];
    const oddPrefix = `${prefix}.odds[${i}]`;
    if (!VALID_BET_TYPES.has(odd.betType)) throw new Error(`${oddPrefix} invalid betType: ${odd.betType}`);
    if (!odd.optionKey) throw new Error(`${oddPrefix} missing optionKey`);
    if (typeof odd.oddsValue !== "number" || Number.isNaN(odd.oddsValue)) throw new Error(`${oddPrefix} invalid oddsValue`);

    const key = `${odd.betType}:${odd.optionKey}`;
    if (seen.has(key)) throw new Error(`${oddPrefix} duplicate ${key}`);
    seen.add(key);
  }
}

function teamPairKey(match) {
  return `${canonicalTeamName(match.homeTeam)}:${canonicalTeamName(match.awayTeam)}`;
}

function buildExistingIndexes(existingMatches) {
  const byApiMatchId = new Map();
  const byExact = new Map();
  const byKickoff = new Map();
  const byTeamPair = new Map();

  for (const match of existingMatches) {
    byApiMatchId.set(match.apiMatchId, match);
    byExact.set(matchKey(match), match);

    const kickoff = kickoffKey(match.kickoffTime);
    const kickoffMatches = byKickoff.get(kickoff) ?? [];
    kickoffMatches.push(match);
    byKickoff.set(kickoff, kickoffMatches);

    const pair = teamPairKey(match);
    const pairMatches = byTeamPair.get(pair) ?? [];
    pairMatches.push(match);
    byTeamPair.set(pair, pairMatches);
  }

  return { byApiMatchId, byExact, byKickoff, byTeamPair };
}

function resolveExistingMatch(importedMatch, indexes) {
  const byApi = indexes.byApiMatchId.get(importedMatch.apiMatchId);
  if (byApi) return byApi;

  const byExact = indexes.byExact.get(matchKey(importedMatch));
  if (byExact) return byExact;

  const sameKickoff = indexes.byKickoff.get(kickoffKey(importedMatch.kickoffTime)) ?? [];
  if (sameKickoff.length === 1) return sameKickoff[0];

  const sameTeamPair = indexes.byTeamPair.get(teamPairKey(importedMatch)) ?? [];
  if (sameTeamPair.length === 1) return sameTeamPair[0];

  return null;
}

function oddsRows(matchId, odds) {
  return odds.map((odd) => ({
    matchId,
    betType: odd.betType,
    optionKey: odd.optionKey,
    oddsValue: odd.oddsValue,
  }));
}

async function main() {
  loadEnvConfig(process.cwd());
  const { file, tournamentId, dryRun } = parseArgs(process.argv);
  const filePath = path.resolve(file);
  const matches = readMatches(filePath);
  matches.forEach(validateMatch);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`);

    const existingMatches = await prisma.match.findMany({
      where: { tournamentId },
      select: { id: true, apiMatchId: true, homeTeam: true, awayTeam: true, kickoffTime: true },
    });
    const indexes = buildExistingIndexes(existingMatches);

    const plan = matches.map((match) => ({
      imported: match,
      existing: resolveExistingMatch(match, indexes),
    }));

    const unmatched = plan.filter((item) => !item.existing);
    if (unmatched.length) {
      console.log("Matches that will be created:");
      for (const item of unmatched) {
        console.log(`  ${item.imported.matchNo ?? item.imported.apiMatchId}: ${item.imported.homeTeam} vs ${item.imported.awayTeam} ${item.imported.kickoffTime}`);
      }
    }

    const totalOdds = matches.reduce((sum, match) => sum + match.odds.length, 0);
    console.log(`Import file: ${filePath}`);
    console.log(`Tournament: ${tournament.id} ${tournament.name}`);
    console.log(`Matches: ${matches.length} (${plan.length - unmatched.length} update, ${unmatched.length} create)`);
    console.log(`Odds: ${totalOdds}`);

    if (dryRun) {
      console.log("Dry run only. No database changes were made.");
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      let updated = 0;
      let created = 0;
      let deletedOdds = 0;
      let insertedOdds = 0;
      const now = new Date();

      for (const item of plan) {
        const imported = item.imported;
        let match = item.existing;

        if (match) {
          await tx.match.update({
            where: { id: match.id },
            data: { oddsUpdatedAt: imported.odds.length ? now : null },
          });
          updated += 1;
        } else {
          match = await tx.match.create({
            data: {
              tournamentId,
              apiMatchId: imported.apiMatchId,
              homeTeam: imported.homeTeam,
              awayTeam: imported.awayTeam,
              kickoffTime: new Date(imported.kickoffTime),
              status: "UPCOMING",
              oddsUpdatedAt: imported.odds.length ? now : null,
            },
            select: { id: true, apiMatchId: true, homeTeam: true, awayTeam: true, kickoffTime: true },
          });
          created += 1;
        }

        const removed = await tx.odds.deleteMany({ where: { matchId: match.id } });
        deletedOdds += removed.count;

        if (imported.odds.length) {
          const inserted = await tx.odds.createMany({ data: oddsRows(match.id, imported.odds) });
          insertedOdds += inserted.count;
        }
      }

      return { updated, created, deletedOdds, insertedOdds };
    });

    console.log(`Done: ${JSON.stringify(result)}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
