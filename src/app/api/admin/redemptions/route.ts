import { prisma } from "@/lib/db";
import { apiSuccess } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

const X1X_LABELS: Record<string, string> = { home: "胜", draw: "平", away: "负" };
const HANDICAP_LABELS: Record<string, string> = { home: "让胜", draw: "让平", away: "让负" };
const MARKET_NAMES: Record<string, string> = {
  X1X: "胜平负",
  HANDICAP_X1X: "让球",
  HALF_FULL: "半全场",
  TOTAL_GOALS: "总进球",
  CORRECT_SCORE: "比分",
};

function formatOptionLabel(market: string, option: string) {
  if (market === "X1X") return X1X_LABELS[option] || option;
  if (market === "HANDICAP_X1X") {
    const [handicap, key] = option.includes(":") ? option.split(":") : ["", option];
    return `${handicap}${HANDICAP_LABELS[key] || key}`;
  }
  return option;
}

export const GET = withAdmin(async () => {
  const where: Record<string, unknown> = { status: "WON" };

  const bets = await prisma.bet.findMany({
    where,
    include: {
      user: { select: { nickname: true } },
      items: {
        include: {
          match: { select: { homeTeam: true, awayTeam: true } },
        },
      },
    },
    orderBy: { settledAt: "desc" },
  });

  const data = bets.map((bet) => ({
    id: bet.id,
    betUid: bet.betUid,
    nickname: bet.user.nickname,
    winAmount: Number(bet.actualPayout ?? 0),
    match: bet.items.map((it) => `${it.match.homeTeam} vs ${it.match.awayTeam}`).join(" · "),
    option: bet.items.map((it) => `${MARKET_NAMES[it.betMarket] || it.betMarket} ${formatOptionLabel(it.betMarket, it.selectedOption)}`).join(" + "),
    settledAt: bet.settledAt?.toISOString(),
  }));

  return apiSuccess(data);
});
