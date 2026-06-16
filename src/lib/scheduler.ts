import { randomUUID } from "crypto";
import { import500Odds, getTodayShanghai } from "@/lib/import-500-odds";
import { import500Results } from "@/lib/import-500-results";
import { safeRecordPullLog } from "@/lib/pull-logs";

declare global {
  var worldcupDailyUpdateScheduler: NodeJS.Timeout | undefined;
  var worldcupDailyUpdateRunning: boolean | undefined;
}

const SHANGHAI_UPDATE_HOURS = [3, 6, 9, 12, 15];

function nextShanghaiRunDelay() {
  const now = new Date();
  const shanghaiNow = new Date(now.getTime() + 8 * 3600 * 1000);

  for (const hour of SHANGHAI_UPDATE_HOURS) {
    const runAt = new Date(Date.UTC(
      shanghaiNow.getUTCFullYear(),
      shanghaiNow.getUTCMonth(),
      shanghaiNow.getUTCDate(),
      hour - 8,
      0,
      0,
      0
    ));

    if (runAt > now) return runAt.getTime() - now.getTime();
  }

  const firstRunTomorrow = new Date(Date.UTC(
    shanghaiNow.getUTCFullYear(),
    shanghaiNow.getUTCMonth(),
    shanghaiNow.getUTCDate() + 1,
    SHANGHAI_UPDATE_HOURS[0] - 8,
    0,
    0,
    0
  ));
  return firstRunTomorrow.getTime() - now.getTime();
}

function getYesterdayShanghai() {
  const now = new Date();
  const shanghai = new Date(now.getTime() + 8 * 3600 * 1000);
  shanghai.setUTCDate(shanghai.getUTCDate() - 1);
  return `${shanghai.getUTCFullYear()}-${String(shanghai.getUTCMonth() + 1).padStart(2, "0")}-${String(shanghai.getUTCDate()).padStart(2, "0")}`;
}

async function runDailyUpdate() {
  if (globalThis.worldcupDailyUpdateRunning) return;
  globalThis.worldcupDailyUpdateRunning = true;

  const batchId = randomUUID();
  const oddsDate = getTodayShanghai();
  const resultsDate = getYesterdayShanghai();
  console.log(`[scheduler] daily update started, odds=${oddsDate}, results=${resultsDate}`);

  try {
    const startedAt = new Date();
    try {
      const odds = await import500Odds(oddsDate);
      console.log(`[scheduler] odds updated`, odds);
      await safeRecordPullLog({
        batchId,
        trigger: "SCHEDULED",
        kind: "ODDS",
        status: "SUCCESS",
        importDate: oddsDate,
        startedAt,
        finishedAt: new Date(),
        summary: odds,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[scheduler] odds update failed", error);
      await safeRecordPullLog({
        batchId,
        trigger: "SCHEDULED",
        kind: "ODDS",
        status: "FAILED",
        importDate: oddsDate,
        startedAt,
        finishedAt: new Date(),
        error: message,
      });
    }

    const resultsStartedAt = new Date();
    try {
      const results = await import500Results(resultsDate);
      console.log(`[scheduler] results updated`, results);
      await safeRecordPullLog({
        batchId,
        trigger: "SCHEDULED",
        kind: "RESULTS",
        status: "SUCCESS",
        importDate: resultsDate,
        startedAt: resultsStartedAt,
        finishedAt: new Date(),
        summary: results,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[scheduler] results update failed", error);
      await safeRecordPullLog({
        batchId,
        trigger: "SCHEDULED",
        kind: "RESULTS",
        status: "FAILED",
        importDate: resultsDate,
        startedAt: resultsStartedAt,
        finishedAt: new Date(),
        error: message,
      });
    }
  } finally {
    globalThis.worldcupDailyUpdateRunning = false;
  }
}

function scheduleNextDailyUpdate() {
  const delay = nextShanghaiRunDelay();
  globalThis.worldcupDailyUpdateScheduler = setTimeout(async () => {
    await runDailyUpdate();
    scheduleNextDailyUpdate();
  }, delay);
}

export function registerDailyUpdateScheduler() {
  if (globalThis.worldcupDailyUpdateScheduler) return;
  scheduleNextDailyUpdate();
}
