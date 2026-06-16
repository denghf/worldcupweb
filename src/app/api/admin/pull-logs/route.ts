import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { withAdmin } from "@/lib/with-auth";

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const trigger = searchParams.get("trigger") || "SCHEDULED";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 50);

    const logs = await prisma.pullLog.findMany({
      where: trigger === "ALL" ? undefined : { trigger: trigger as "MANUAL" | "SCHEDULED" },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return apiSuccess(logs.map((log) => ({
      id: log.id,
      batchId: log.batchId,
      source: log.source,
      trigger: log.trigger,
      kind: log.kind,
      status: log.status,
      importDate: log.importDate,
      fetched: log.fetched,
      updated: log.updated,
      created: log.created,
      settled: log.settled,
      skipped: log.skipped,
      message: log.message,
      error: log.error,
      items: log.items,
      startedAt: log.startedAt,
      finishedAt: log.finishedAt,
      createdAt: log.createdAt,
    })));
  } catch (e) {
    console.error("Pull logs error:", e);
    return apiError("拉取日志获取失败", 500);
  }
});
