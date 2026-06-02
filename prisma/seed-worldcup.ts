import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. 获取或创建世界杯赛事
  let tournament = await prisma.tournament.findFirst({
    where: { name: { contains: "2026" } },
  });

  if (!tournament) {
    tournament = await prisma.tournament.create({
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
  } else {
    console.log("Using existing tournament:", tournament.name);
  }

  // 2. 先删除关联数据，再删除比赛
  await prisma.betItem.deleteMany({});
  await prisma.bet.deleteMany({});
  const deletedMatches = await prisma.match.deleteMany({
    where: { tournamentId: tournament.id },
  });
  console.log("Deleted old matches:", deletedMatches.count);

  // 3. A组赛程（来自 500.com）
  const groupAMatches = [
    { homeTeam: "墨西哥", awayTeam: "南非", date: "2026-06-12", time: "03:00" },
    { homeTeam: "巴西", awayTeam: "秘鲁", date: "2026-06-12", time: "10:00" },
    { homeTeam: "秘鲁", awayTeam: "南非", date: "2026-06-19", time: "00:00" },
    { homeTeam: "墨西哥", awayTeam: "巴西", date: "2026-06-19", time: "09:00" },
    { homeTeam: "秘鲁", awayTeam: "墨西哥", date: "2026-06-25", time: "09:00" },
    { homeTeam: "南非", awayTeam: "巴西", date: "2026-06-25", time: "09:00" },
  ];

  // 4. 创建比赛 + 赔率
  for (let i = 0; i < groupAMatches.length; i++) {
    const m = groupAMatches[i];
    const kickoffTime = new Date(`${m.date}T${m.time}:00+08:00`); // 500.com 是中国时间

    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        apiMatchId: `wc2026-a${String(i + 1).padStart(3, "0")}`,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        kickoffTime,
        status: "UPCOMING",
      },
    });

    // 创建默认赔率（基于球队实力差异设置合理值）
    const oddsData = [
      // X1X
      { betType: "X1X" as const, optionKey: "home", oddsValue: 2.0 + Math.random() * 1.5 },
      { betType: "X1X" as const, optionKey: "draw", oddsValue: 3.2 + Math.random() * 0.6 },
      { betType: "X1X" as const, optionKey: "away", oddsValue: 2.5 + Math.random() * 1.5 },
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
      data: oddsData.map((o) => ({
        ...o,
        matchId: match.id,
        oddsValue: Math.round(o.oddsValue * 100) / 100,
      })),
    });

    console.log(`Created: ${m.homeTeam} vs ${m.awayTeam} @ ${m.date} ${m.time}`);
  }

  // 5. 重置用户统计
  await prisma.userStats.updateMany({
    data: {
      totalBets: 0,
      totalWonBets: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      netProfit: 0,
    },
  });

  // 7. 重置钱包（恢复到初始 1000）
  await prisma.wallet.updateMany({
    data: { balance: 1000 },
  });

  console.log("\n✅ 2026 世界杯 A组赛程已导入！");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
