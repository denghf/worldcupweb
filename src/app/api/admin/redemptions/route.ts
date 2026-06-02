import { prisma } from "@/lib/db";
import { apiSuccess } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

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

  // For now all WON bets are considered "claimable" — there's no separate claim status in schema
  // We can use a simple heuristic: if settledAt exists but no explicit claim tracking, treat as pending
  // In a real system you'd have a claimStatus field. For simplicity, all WON = pending, then admin marks as handled.
  const data = bets.map((bet) => ({
    id: bet.id,
    betUid: bet.betUid,
    nickname: bet.user.nickname,
    winAmount: Number(bet.actualPayout ?? 0),
    match: bet.items.map((it) => `${it.match.homeTeam} vs ${it.match.awayTeam}`).join(" · "),
    option: bet.items.map((it) => it.selectedOption).join(" + "),
    settledAt: bet.settledAt?.toISOString(),
  }));

  return apiSuccess(data);
});
