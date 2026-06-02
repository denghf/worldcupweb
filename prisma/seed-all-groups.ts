import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ET (UTC-4 in June) -> Beijing (UTC+8) = +12 hours
function etToBeijing(dateStr: string, timeStr: string): Date {
  const [month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  // ET date
  const etDate = new Date(2026, month - 1, day, hour, minute);
  // Add 12 hours for Beijing
  return new Date(etDate.getTime() + 12 * 60 * 60 * 1000);
}

const GROUPS = [
  {
    name: "A组",
    matches: [
      { date: "06-11", time: "15:00", home: "墨西哥", away: "南非" },
      { date: "06-11", time: "22:00", home: "韩国", away: "捷克" },
      { date: "06-18", time: "12:00", home: "捷克", away: "南非" },
      { date: "06-18", time: "21:00", home: "墨西哥", away: "韩国" },
      { date: "06-24", time: "21:00", home: "捷克", away: "墨西哥" },
      { date: "06-24", time: "21:00", home: "南非", away: "韩国" },
    ],
  },
  {
    name: "B组",
    matches: [
      { date: "06-12", time: "15:00", home: "加拿大", away: "波黑" },
      { date: "06-13", time: "15:00", home: "卡塔尔", away: "瑞士" },
      { date: "06-18", time: "15:00", home: "瑞士", away: "波黑" },
      { date: "06-18", time: "18:00", home: "加拿大", away: "卡塔尔" },
      { date: "06-24", time: "15:00", home: "瑞士", away: "加拿大" },
      { date: "06-24", time: "15:00", home: "波黑", away: "卡塔尔" },
    ],
  },
  {
    name: "C组",
    matches: [
      { date: "06-13", time: "18:00", home: "巴西", away: "摩洛哥" },
      { date: "06-13", time: "21:00", home: "海地", away: "苏格兰" },
      { date: "06-19", time: "18:00", home: "苏格兰", away: "摩洛哥" },
      { date: "06-19", time: "21:00", home: "巴西", away: "海地" },
      { date: "06-24", time: "18:00", home: "苏格兰", away: "巴西" },
      { date: "06-24", time: "18:00", home: "摩洛哥", away: "海地" },
    ],
  },
  {
    name: "D组",
    matches: [
      { date: "06-12", time: "21:00", home: "美国", away: "巴拉圭" },
      { date: "06-13", time: "00:00", home: "澳大利亚", away: "土耳其" },
      { date: "06-19", time: "15:00", home: "美国", away: "澳大利亚" },
      { date: "06-19", time: "23:00", home: "土耳其", away: "巴拉圭" },
      { date: "06-25", time: "22:00", home: "土耳其", away: "美国" },
      { date: "06-25", time: "22:00", home: "巴拉圭", away: "澳大利亚" },
    ],
  },
  {
    name: "E组",
    matches: [
      { date: "06-14", time: "13:00", home: "德国", away: "库拉索" },
      { date: "06-14", time: "19:00", home: "科特迪瓦", away: "厄瓜多尔" },
      { date: "06-20", time: "16:00", home: "德国", away: "科特迪瓦" },
      { date: "06-20", time: "20:00", home: "厄瓜多尔", away: "库拉索" },
      { date: "06-25", time: "16:00", home: "厄瓜多尔", away: "德国" },
      { date: "06-25", time: "16:00", home: "库拉索", away: "科特迪瓦" },
    ],
  },
  {
    name: "F组",
    matches: [
      { date: "06-14", time: "16:00", home: "荷兰", away: "日本" },
      { date: "06-14", time: "22:00", home: "瑞典", away: "突尼斯" },
      { date: "06-20", time: "13:00", home: "荷兰", away: "瑞典" },
      { date: "06-20", time: "00:00", home: "突尼斯", away: "日本" },
      { date: "06-25", time: "19:00", home: "突尼斯", away: "荷兰" },
      { date: "06-25", time: "19:00", home: "日本", away: "瑞典" },
    ],
  },
  {
    name: "G组",
    matches: [
      { date: "06-15", time: "15:00", home: "比利时", away: "埃及" },
      { date: "06-15", time: "21:00", home: "伊朗", away: "新西兰" },
      { date: "06-21", time: "15:00", home: "比利时", away: "伊朗" },
      { date: "06-21", time: "21:00", home: "新西兰", away: "埃及" },
      { date: "06-26", time: "23:00", home: "新西兰", away: "比利时" },
      { date: "06-26", time: "23:00", home: "埃及", away: "伊朗" },
    ],
  },
  {
    name: "H组",
    matches: [
      { date: "06-15", time: "12:00", home: "西班牙", away: "佛得角" },
      { date: "06-15", time: "18:00", home: "沙特", away: "乌拉圭" },
      { date: "06-21", time: "12:00", home: "西班牙", away: "沙特" },
      { date: "06-21", time: "18:00", home: "乌拉圭", away: "佛得角" },
      { date: "06-26", time: "20:00", home: "乌拉圭", away: "西班牙" },
      { date: "06-26", time: "20:00", home: "佛得角", away: "沙特" },
    ],
  },
  {
    name: "I组",
    matches: [
      { date: "06-16", time: "15:00", home: "法国", away: "塞内加尔" },
      { date: "06-16", time: "18:00", home: "伊拉克", away: "挪威" },
      { date: "06-22", time: "17:00", home: "法国", away: "伊拉克" },
      { date: "06-22", time: "20:00", home: "挪威", away: "塞内加尔" },
      { date: "06-26", time: "15:00", home: "挪威", away: "法国" },
      { date: "06-26", time: "15:00", home: "塞内加尔", away: "伊拉克" },
    ],
  },
  {
    name: "J组",
    matches: [
      { date: "06-16", time: "21:00", home: "阿根廷", away: "阿尔及利亚" },
      { date: "06-17", time: "00:00", home: "奥地利", away: "约旦" },
      { date: "06-22", time: "13:00", home: "阿根廷", away: "奥地利" },
      { date: "06-22", time: "23:00", home: "约旦", away: "阿尔及利亚" },
      { date: "06-27", time: "22:00", home: "约旦", away: "阿根廷" },
      { date: "06-27", time: "22:00", home: "阿尔及利亚", away: "奥地利" },
    ],
  },
  {
    name: "K组",
    matches: [
      { date: "06-17", time: "13:00", home: "葡萄牙", away: "刚果（金）" },
      { date: "06-17", time: "22:00", home: "乌兹别克斯坦", away: "哥伦比亚" },
      { date: "06-23", time: "13:00", home: "葡萄牙", away: "乌兹别克斯坦" },
      { date: "06-23", time: "22:00", home: "哥伦比亚", away: "刚果（金）" },
      { date: "06-27", time: "19:30", home: "哥伦比亚", away: "葡萄牙" },
      { date: "06-27", time: "19:30", home: "刚果（金）", away: "乌兹别克斯坦" },
    ],
  },
  {
    name: "L组",
    matches: [
      { date: "06-17", time: "16:00", home: "英格兰", away: "克罗地亚" },
      { date: "06-17", time: "19:00", home: "加纳", away: "巴拿马" },
      { date: "06-23", time: "16:00", home: "英格兰", away: "加纳" },
      { date: "06-23", time: "19:00", home: "巴拿马", away: "克罗地亚" },
      { date: "06-27", time: "17:00", home: "巴拿马", away: "英格兰" },
      { date: "06-27", time: "17:00", home: "克罗地亚", away: "加纳" },
    ],
  },
];

async function main() {
  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: "2026" } },
  });

  if (!tournament) {
    console.error("Tournament not found");
    process.exit(1);
  }

  // Clean up
  await prisma.betItem.deleteMany({});
  await prisma.bet.deleteMany({});
  await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });
  console.log("Cleaned up old data");

  let totalMatches = 0;
  let totalOdds = 0;

  for (const group of GROUPS) {
    for (let i = 0; i < group.matches.length; i++) {
      const m = group.matches[i];
      const kickoffTime = etToBeijing(m.date, m.time);

      const match = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          apiMatchId: `wc2026-${group.name.toLowerCase().replace("组", "")}${String(i + 1).padStart(2, "0")}`,
          homeTeam: m.home,
          awayTeam: m.away,
          kickoffTime,
          status: "UPCOMING",
        },
      });

      // Default odds with some randomization based on team strength
      const baseHome = 1.8 + Math.random() * 1.8;
      const baseDraw = 3.0 + Math.random() * 0.8;
      const baseAway = 2.0 + Math.random() * 1.8;

      const oddsData = [
        { betType: "X1X" as const, optionKey: "home", oddsValue: baseHome },
        { betType: "X1X" as const, optionKey: "draw", oddsValue: baseDraw },
        { betType: "X1X" as const, optionKey: "away", oddsValue: baseAway },
        { betType: "TOTAL_GOALS" as const, optionKey: "0球", oddsValue: 8.0 + Math.random() * 2 },
        { betType: "TOTAL_GOALS" as const, optionKey: "1球", oddsValue: 4.0 + Math.random() * 1 },
        { betType: "TOTAL_GOALS" as const, optionKey: "2球", oddsValue: 3.0 + Math.random() * 0.8 },
        { betType: "TOTAL_GOALS" as const, optionKey: "3球+", oddsValue: 1.8 + Math.random() * 0.8 },
        { betType: "CORRECT_SCORE" as const, optionKey: "1:0", oddsValue: 6.0 + Math.random() * 2 },
        { betType: "CORRECT_SCORE" as const, optionKey: "1:1", oddsValue: 5.0 + Math.random() * 1.5 },
        { betType: "CORRECT_SCORE" as const, optionKey: "2:0", oddsValue: 8.0 + Math.random() * 3 },
        { betType: "CORRECT_SCORE" as const, optionKey: "2:1", oddsValue: 7.0 + Math.random() * 2 },
        { betType: "CORRECT_SCORE" as const, optionKey: "0:1", oddsValue: 7.0 + Math.random() * 3 },
        { betType: "CORRECT_SCORE" as const, optionKey: "0:0", oddsValue: 7.0 + Math.random() * 2 },
      ];

      await prisma.odds.createMany({
        data: oddsData.map((o) => ({
          ...o,
          matchId: match.id,
          oddsValue: Math.round(o.oddsValue * 100) / 100,
        })),
      });

      totalMatches++;
      totalOdds += oddsData.length;
    }
    console.log(`Created ${group.name}: ${group.matches.length} matches`);
  }

  // Reset user stats
  await prisma.userStats.updateMany({
    data: {
      totalBets: 0,
      totalWonBets: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      netProfit: 0,
    },
  });
  await prisma.wallet.updateMany({ data: { balance: 1000 } });

  console.log(`\n✅ Done! ${totalMatches} matches, ${totalOdds} odds entries created.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
