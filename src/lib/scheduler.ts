import { import500Odds, getTodayShanghai } from "@/lib/import-500-odds";
import { import500Results } from "@/lib/import-500-results";

declare global {
  var worldcupDailyUpdateScheduler: NodeJS.Timeout | undefined;
  var worldcupDailyUpdateRunning: boolean | undefined;
}

function nextShanghaiRunDelay() {
  const now = new Date();
  const shanghaiNow = new Date(now.getTime() + 8 * 3600 * 1000);
  const runAt = new Date(Date.UTC(
    shanghaiNow.getUTCFullYear(),
    shanghaiNow.getUTCMonth(),
    shanghaiNow.getUTCDate(),
    15 - 8,
    0,
    0,
    0
  ));

  if (runAt <= now) runAt.setUTCDate(runAt.getUTCDate() + 1);
  return runAt.getTime() - now.getTime();
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

  const oddsDate = getTodayShanghai();
  const resultsDate = getYesterdayShanghai();
  try {
    console.log(`[scheduler] daily update started, odds=${oddsDate}, results=${resultsDate}`);
    const odds = await import500Odds(oddsDate);
    console.log(`[scheduler] odds updated`, odds);
    const results = await import500Results(resultsDate);
    console.log(`[scheduler] results updated`, results);
  } catch (error) {
    console.error("[scheduler] daily update failed", error);
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
