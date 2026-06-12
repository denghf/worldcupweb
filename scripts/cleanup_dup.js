#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

loadEnvConfig(process.cwd());

const ALIASES = {
  "沙特阿拉伯": "沙特",
  "乌兹别克": "乌兹别克斯坦",
  "刚果(金)": "刚果（金）",
};

function canonical(name) {
  const n = String(name).trim().replace(/\s+/g, "");
  return ALIASES[n] ?? n;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const matches = await prisma.match.findMany({
      select: { id: true, apiMatchId: true, homeTeam: true, awayTeam: true, kickoffTime: true },
      orderBy: { id: "asc" },
    });

    const grouped = new Map();
    for (const m of matches) {
      const key = `${canonical(m.homeTeam)} vs ${canonical(m.awayTeam)} @ ${m.kickoffTime.getTime()}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(m);
    }

    const toDelete = [];
    for (const [, items] of grouped) {
      if (items.length < 2) continue;
      items.sort((a, b) => a.id - b.id);
      const keep = items[0];
      for (const r of items.slice(1)) {
        console.log(`  DEL id=${r.id} ${r.apiMatchId} ${r.homeTeam} vs ${r.awayTeam} (keep ${keep.apiMatchId})`);
        toDelete.push(r.id);
      }
    }

    if (toDelete.length === 0) {
      console.log("No duplicates found.");
      return;
    }

    console.log(`\nDeleting ${toDelete.length} duplicates...`);
    await prisma.odds.deleteMany({ where: { matchId: { in: toDelete } } });
    await prisma.betItem.deleteMany({ where: { matchId: { in: toDelete } } });
    await prisma.bet.deleteMany({ where: { items: { none: {} } } });
    const result = await prisma.match.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`Done, deleted ${result.count} matches.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
