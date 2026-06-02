import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if data already exists
  const existingMatches = await prisma.match.count();
  if (existingMatches > 0) {
    console.log("Demo data already exists, skipping.");
    return;
  }

  // 1. Create tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: "2026 FIFA World Cup",
      leagueId: 1,
      season: "2026",
      startDate: new Date("2026-06-11"),
      endDate: new Date("2026-07-19"),
      status: "ACTIVE",
    },
  });
  console.log("Tournament created:", tournament.name);

  // 2. Create matches
  const matches = await Promise.all([
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        apiMatchId: "demo-001",
        homeTeam: "巴西",
        awayTeam: "德国",
        homeTeamLogo: "/images/brazil.png",
        awayTeamLogo: "/images/germany.png",
        kickoffTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
        status: "UPCOMING",
      },
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        apiMatchId: "demo-002",
        homeTeam: "阿根廷",
        awayTeam: "法国",
        homeTeamLogo: "/images/argentina.png",
        awayTeamLogo: "/images/france.png",
        kickoffTime: new Date(Date.now() + 86400000 * 3),
        status: "UPCOMING",
      },
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        apiMatchId: "demo-003",
        homeTeam: "英格兰",
        awayTeam: "西班牙",
        homeTeamLogo: "/images/england.png",
        awayTeamLogo: "/images/spain.png",
        kickoffTime: new Date(Date.now() + 86400000),
        status: "UPCOMING",
      },
    }),
  ]);
  console.log("Matches created:", matches.map((m) => `${m.homeTeam} vs ${m.awayTeam}`).join(", "));

  // 3. Create odds for each match
  for (const match of matches) {
    const oddsData = [
      // X1X
      { betType: "X1X" as const, optionKey: "home", oddsValue: 2.1 },
      { betType: "X1X" as const, optionKey: "draw", oddsValue: 3.4 },
      { betType: "X1X" as const, optionKey: "away", oddsValue: 3.0 },
      // Total Goals
      { betType: "TOTAL_GOALS" as const, optionKey: "0球", oddsValue: 8.0 },
      { betType: "TOTAL_GOALS" as const, optionKey: "1球", oddsValue: 4.5 },
      { betType: "TOTAL_GOALS" as const, optionKey: "2球", oddsValue: 3.2 },
      { betType: "TOTAL_GOALS" as const, optionKey: "3球+", oddsValue: 2.1 },
      // Correct Score
      { betType: "CORRECT_SCORE" as const, optionKey: "1:0", oddsValue: 6.5 },
      { betType: "CORRECT_SCORE" as const, optionKey: "1:1", oddsValue: 5.0 },
      { betType: "CORRECT_SCORE" as const, optionKey: "2:0", oddsValue: 9.0 },
      { betType: "CORRECT_SCORE" as const, optionKey: "2:1", oddsValue: 7.0 },
      { betType: "CORRECT_SCORE" as const, optionKey: "0:1", oddsValue: 8.5 },
      { betType: "CORRECT_SCORE" as const, optionKey: "0:0", oddsValue: 7.5 },
    ];

    await prisma.odds.createMany({
      data: oddsData.map((o) => ({ ...o, matchId: match.id })),
    });
  }
  console.log("Odds created for all matches");

  // 4. Create demo players
  const players = await Promise.all([
    prisma.user.create({ data: { username: "xiaoming", nickname: "小明", role: "PLAYER" } }),
    prisma.user.create({ data: { username: "laowang", nickname: "老王", role: "PLAYER" } }),
    prisma.user.create({ data: { username: "ahua", nickname: "阿花", role: "PLAYER" } }),
    prisma.user.create({ data: { username: "dapang", nickname: "大胖", role: "PLAYER" } }),
    prisma.user.create({ data: { username: "xiaoli", nickname: "小李", role: "PLAYER" } }),
  ]);

  // Create wallets and stats for each player
  for (const player of players) {
    await prisma.wallet.create({ data: { userId: player.id, balance: 1000 } });
    await prisma.userStats.create({ data: { userId: player.id } });
  }
  console.log("Players created:", players.map((p) => p.nickname).join(", "));

  console.log("\n✅ Demo data initialized successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
