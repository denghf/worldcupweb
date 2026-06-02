import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type OddsInput = {
  betType: "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE";
  optionKey: string;
  oddsValue: number;
};

type TestMatch = {
  apiMatchId: string;
  matchNo: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  handicap: number;
  odds: OddsInput[];
};

const HALF_FULL_OPTIONS = ["胜胜", "胜平", "胜负", "平胜", "平平", "平负", "负胜", "负平", "负负"];

const TEST_MATCHES: TestMatch[] = [
  {
    apiMatchId: "500-1393328",
    matchNo: "周二201",
    homeTeam: "克罗地亚",
    awayTeam: "比利时",
    kickoffTime: "2026-06-03T00:00:00+08:00",
    handicap: -1,
    odds: [
      ...x1x(2.57, 2.85, 2.57),
      ...handicapX1x(-1, 5.5, 4.48, 1.38),
      ...halfFull([4.3, 14, 30, 5.4, 4.8, 5.4, 30, 14, 4.3]),
      ...correctScores([
        ["1:0", 9], ["2:0", 14], ["2:1", 8.35], ["3:0", 27], ["3:1", 21], ["3:2", 26],
        ["4:0", 70], ["4:1", 48], ["4:2", 65], ["5:0", 200], ["5:1", 125], ["5:2", 180], ["胜其它", 60],
        ["0:0", 13], ["1:1", 5.6], ["2:2", 11], ["3:3", 30], ["平其它", 160],
        ["0:1", 9], ["0:2", 14], ["1:2", 8.35], ["0:3", 27], ["1:3", 21], ["2:3", 26],
        ["0:4", 70], ["1:4", 48], ["2:4", 65], ["0:5", 200], ["1:5", 125], ["2:5", 180], ["负其它", 60],
      ]),
      ...totalGoals([13, 4.6, 3.8, 3.2, 5.55, 9.25, 17, 27]),
    ],
  },
  {
    apiMatchId: "500-1412373",
    matchNo: "周二202",
    homeTeam: "格鲁吉亚",
    awayTeam: "罗马尼亚",
    kickoffTime: "2026-06-03T01:00:00+08:00",
    handicap: -1,
    odds: [
      ...x1x(2.07, 3.02, 3.17),
      ...handicapX1x(-1, 4.66, 3.65, 1.56),
      ...halfFull([3.15, 14, 34, 4.8, 5.1, 7.2, 28, 14, 5.4]),
      ...correctScores([
        ["1:0", 7], ["2:0", 9.5], ["2:1", 7], ["3:0", 18], ["3:1", 17], ["3:2", 23],
        ["4:0", 42], ["4:1", 38], ["4:2", 60], ["5:0", 100], ["5:1", 80], ["5:2", 150], ["胜其它", 60],
        ["0:0", 11], ["1:1", 6], ["2:2", 13.5], ["3:3", 55], ["平其它", 250],
        ["0:1", 10], ["0:2", 17], ["1:2", 10.5], ["0:3", 40], ["1:3", 29], ["2:3", 33],
        ["0:4", 100], ["1:4", 80], ["2:4", 100], ["0:5", 400], ["1:5", 250], ["2:5", 300], ["负其它", 120],
      ]),
      ...totalGoals([11, 4.5, 3.1, 3.5, 6.1, 11, 21, 33]),
    ],
  },
  {
    apiMatchId: "500-1411394",
    matchNo: "周二203",
    homeTeam: "威尔士",
    awayTeam: "加纳",
    kickoffTime: "2026-06-03T02:45:00+08:00",
    handicap: -1,
    odds: [
      ...x1x(2.09, 2.86, 3.32),
      ...handicapX1x(-1, 4.65, 3.71, 1.55),
      ...halfFull([3.4, 14, 38, 4.2, 4.75, 7.5, 30, 14, 5.7]),
      ...correctScores([
        ["1:0", 6.75], ["2:0", 9.5], ["2:1", 7.5], ["3:0", 20], ["3:1", 18], ["3:2", 27],
        ["4:0", 40], ["4:1", 40], ["4:2", 70], ["5:0", 120], ["5:1", 120], ["5:2", 200], ["胜其它", 80],
        ["0:0", 9.5], ["1:1", 5.9], ["2:2", 14], ["3:3", 60], ["平其它", 400],
        ["0:1", 9], ["0:2", 15], ["1:2", 10], ["0:3", 40], ["1:3", 28], ["2:3", 35],
        ["0:4", 100], ["1:4", 80], ["2:4", 100], ["0:5", 400], ["1:5", 300], ["2:5", 400], ["负其它", 150],
      ]),
      ...totalGoals([9.5, 3.9, 3.3, 3.3, 6.4, 13.5, 29, 45]),
    ],
  },
];

async function main() {
  const tournament = await prisma.tournament.upsert({
    where: { id: 5002026 },
    update: {
      name: "500.com 赔率测试赛",
      status: "ACTIVE",
    },
    create: {
      id: 5002026,
      name: "500.com 赔率测试赛",
      leagueId: 500,
      season: "2026",
      startDate: new Date("2026-06-03T00:00:00+08:00"),
      endDate: new Date("2026-06-03T03:00:00+08:00"),
      status: "ACTIVE",
    },
  });

  const existingMatches = await prisma.match.findMany({
    where: { apiMatchId: { in: TEST_MATCHES.map((match) => match.apiMatchId) } },
    select: { id: true },
  });
  const existingMatchIds = existingMatches.map((match) => match.id);

  if (existingMatchIds.length > 0) {
    await prisma.betItem.deleteMany({ where: { matchId: { in: existingMatchIds } } });
    await prisma.bet.deleteMany({ where: { items: { none: {} } } });
    await prisma.match.deleteMany({ where: { id: { in: existingMatchIds } } });
  }

  for (const testMatch of TEST_MATCHES) {
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        apiMatchId: testMatch.apiMatchId,
        homeTeam: testMatch.homeTeam,
        awayTeam: testMatch.awayTeam,
        kickoffTime: new Date(testMatch.kickoffTime),
        status: "UPCOMING",
        oddsUpdatedAt: new Date(),
      },
    });

    await prisma.odds.createMany({
      data: testMatch.odds.map((odd) => ({ ...odd, matchId: match.id })),
    });

    console.log(`${testMatch.matchNo} ${testMatch.homeTeam} vs ${testMatch.awayTeam}: ${testMatch.odds.length} odds`);
  }

  console.log("Imported 500.com test matches");
}

function x1x(home: number, draw: number, away: number): OddsInput[] {
  return [
    { betType: "X1X", optionKey: "home", oddsValue: home },
    { betType: "X1X", optionKey: "draw", oddsValue: draw },
    { betType: "X1X", optionKey: "away", oddsValue: away },
  ];
}

function handicapX1x(handicap: number, home: number, draw: number, away: number): OddsInput[] {
  return [
    { betType: "HANDICAP_X1X", optionKey: `${handicap}:home`, oddsValue: home },
    { betType: "HANDICAP_X1X", optionKey: `${handicap}:draw`, oddsValue: draw },
    { betType: "HANDICAP_X1X", optionKey: `${handicap}:away`, oddsValue: away },
  ];
}

function halfFull(values: number[]): OddsInput[] {
  return HALF_FULL_OPTIONS.map((optionKey, index) => ({
    betType: "HALF_FULL",
    optionKey,
    oddsValue: values[index],
  }));
}

function correctScores(values: [string, number][]): OddsInput[] {
  return values.map(([optionKey, oddsValue]) => ({
    betType: "CORRECT_SCORE",
    optionKey,
    oddsValue,
  }));
}

function totalGoals(values: number[]): OddsInput[] {
  return ["0球", "1球", "2球", "3球", "4球", "5球", "6球", "7+"].map((optionKey, index) => ({
    betType: "TOTAL_GOALS",
    optionKey,
    oddsValue: values[index],
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
