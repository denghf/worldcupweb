import { prisma } from "@/lib/db";
import type { Import500OddsSummary } from "@/lib/import-500-odds";
import type { Import500ResultsSummary } from "@/lib/import-500-results";

type PullLogKind = "ODDS" | "RESULTS";
type PullLogTrigger = "MANUAL" | "SCHEDULED";
type PullLogStatus = "SUCCESS" | "FAILED";

type PullLogInput = {
  batchId?: string;
  trigger: PullLogTrigger;
  kind: PullLogKind;
  status: PullLogStatus;
  importDate: string;
  startedAt: Date;
  finishedAt: Date;
  summary?: Import500OddsSummary | Import500ResultsSummary;
  error?: string;
};

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function getCounts(kind: PullLogKind, summary?: Import500OddsSummary | Import500ResultsSummary) {
  if (!summary) return { fetched: 0, updated: 0, created: 0, settled: 0, skipped: 0 };
  if (kind === "ODDS") {
    const oddsSummary = summary as Import500OddsSummary;
    return {
      fetched: oddsSummary.fetched,
      updated: oddsSummary.updated,
      created: oddsSummary.created,
      settled: 0,
      skipped: 0,
    };
  }

  const resultsSummary = summary as Import500ResultsSummary;
  return {
    fetched: resultsSummary.fetched,
    updated: 0,
    created: 0,
    settled: resultsSummary.settled,
    skipped: resultsSummary.skipped,
  };
}

export async function recordPullLog(input: PullLogInput) {
  const counts = getCounts(input.kind, input.summary);
  return prisma.pullLog.create({
    data: {
      batchId: input.batchId,
      trigger: input.trigger,
      kind: input.kind,
      status: input.status,
      importDate: input.importDate,
      ...counts,
      message: input.summary?.message,
      error: input.error,
      items: toJson(input.summary?.items ?? []),
      startedAt: input.startedAt,
      finishedAt: input.finishedAt,
    },
  });
}

export async function safeRecordPullLog(input: PullLogInput) {
  try {
    await recordPullLog(input);
  } catch (error) {
    console.error("[pull-log] failed to record pull log", error);
  }
}
