export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerDailyUpdateScheduler } = await import("@/lib/scheduler");
  registerDailyUpdateScheduler();
}
