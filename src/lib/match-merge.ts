import { prisma } from "@/lib/db";
import { BEIJING_DEDUP_MIN_DATE, canonicalTeam, getBeijingDateKey } from "@/lib/beijing-time";

export interface MergeDetail {
  dateKey: string;
  homeTeam: string;
  awayTeam: string;
  kept: number;
  deleted: number[];
  migratedBetItems: number;
  dedupedBetItems: number;
}

export interface MergeSummary {
  minDate: string;
  mergedGroups: number;
  deletedMatches: number;
  migratedBetItems: number;
  dedupedBetItems: number;
  details: MergeDetail[];
}

type Candidate = {
  id: number;
  apiMatchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: Date;
  oddsUpdatedAt: Date | null;
};

function pickKept(group: Candidate[]): Candidate {
  return [...group].sort((a, b) => {
    const aT = a.oddsUpdatedAt?.getTime() ?? 0;
    const bT = b.oddsUpdatedAt?.getTime() ?? 0;
    if (aT !== bT) return bT - aT;
    return b.id - a.id;
  })[0];
}

export async function mergeDuplicateMatches(opts: { minDate?: string } = {}): Promise<MergeSummary> {
  const minDate = opts.minDate ?? BEIJING_DEDUP_MIN_DATE;
  const minDateMs = new Date(`${minDate}T00:00:00+08:00`).getTime();

  return prisma.$transaction(async (tx) => {
    const candidates = await tx.match.findMany({
      where: { kickoffTime: { gte: new Date(minDateMs) } },
      select: {
        id: true,
        apiMatchId: true,
        homeTeam: true,
        awayTeam: true,
        kickoffTime: true,
        oddsUpdatedAt: true,
      },
    });

    const grouped = new Map<string, Candidate[]>();
    for (const m of candidates) {
      const key = `${getBeijingDateKey(m.kickoffTime)}:${canonicalTeam(m.homeTeam)}:${canonicalTeam(m.awayTeam)}`;
      const list = grouped.get(key);
      if (list) list.push(m);
      else grouped.set(key, [m]);
    }

    const details: MergeDetail[] = [];
    let totalDeleted = 0;
    let totalMigrated = 0;
    let totalDeduped = 0;

    for (const [key, group] of grouped) {
      if (group.length < 2) continue;
      const kept = pickKept(group);
      const deletedIds = group.filter((m) => m.id !== kept.id).map((m) => m.id);
      if (deletedIds.length === 0) continue;

      const [keptBetItems, deletedBetItems] = await Promise.all([
        tx.betItem.findMany({ where: { matchId: kept.id }, select: { betId: true } }),
        tx.betItem.findMany({ where: { matchId: { in: deletedIds } }, select: { id: true, betId: true } }),
      ]);
      const keptBetIds = new Set(keptBetItems.map((b) => b.betId));

      const conflictIds = deletedBetItems.filter((b) => keptBetIds.has(b.betId)).map((b) => b.id);
      if (conflictIds.length > 0) {
        await tx.betItem.deleteMany({ where: { id: { in: conflictIds } } });
      }
      totalDeduped += conflictIds.length;

      const migrated = await tx.betItem.updateMany({
        where: { matchId: { in: deletedIds } },
        data: { matchId: kept.id },
      });
      totalMigrated += migrated.count;

      await tx.match.deleteMany({ where: { id: { in: deletedIds } } });
      totalDeleted += deletedIds.length;

      const [dateKey, homeTeam, awayTeam] = key.split(":");
      details.push({
        dateKey,
        homeTeam,
        awayTeam,
        kept: kept.id,
        deleted: deletedIds,
        migratedBetItems: migrated.count,
        dedupedBetItems: conflictIds.length,
      });
    }

    return {
      minDate,
      mergedGroups: details.length,
      deletedMatches: totalDeleted,
      migratedBetItems: totalMigrated,
      dedupedBetItems: totalDeduped,
      details,
    };
  });
}
