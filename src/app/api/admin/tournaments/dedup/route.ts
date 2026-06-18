import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";
import { prisma } from "@/lib/db";

const TEAM_ALIASES: Record<string, string> = {
  "沙特": "沙特阿拉伯",
  "乌兹别克": "乌兹别克斯坦",
  "刚果(金)": "刚果（金）",
  "民主刚果": "刚果（金）",
};

function canonicalTeam(name: string): string {
  const n = name.trim().replace(/\s+/g, "").replace(/\(/g, "（").replace(/\)/g, "）");
  return TEAM_ALIASES[n] ?? n;
}

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

export const POST = withAdmin(async () => {
  try {
    const matches = await prisma.match.findMany({
      select: { id: true, apiMatchId: true, homeTeam: true, awayTeam: true, kickoffTime: true },
      orderBy: { id: "asc" },
    });

    const grouped = new Map<string, typeof matches>();
    for (const m of matches) {
      const key = `${dateKey(m.kickoffTime)}:${canonicalTeam(m.homeTeam)}:${canonicalTeam(m.awayTeam)}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }

    const toDelete: number[] = [];
    for (const [, items] of grouped) {
      if (items.length < 2) continue;
      // Keep lowest id, delete the rest
      items.sort((a, b) => a.id - b.id);
      for (const r of items.slice(1)) toDelete.push(r.id);
    }

    if (toDelete.length === 0) return apiSuccess({ deleted: 0, message: "没有重复赛事" });

    await prisma.$transaction(async (tx) => {
      await tx.odds.deleteMany({ where: { matchId: { in: toDelete } } });
      await tx.betItem.deleteMany({ where: { matchId: { in: toDelete } } });
      await tx.bet.deleteMany({ where: { items: { none: {} } } });
      await tx.match.deleteMany({ where: { id: { in: toDelete } } });
    });

    return apiSuccess({ deleted: toDelete.length });
  } catch (e) {
    console.error("Dedup error:", e);
    return apiError("清理失败: " + (e instanceof Error ? e.message : String(e)), 500);
  }
});
