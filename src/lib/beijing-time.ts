export const TEAM_ALIASES: Record<string, string> = {
  "沙特": "沙特阿拉伯",
  "乌兹别克": "乌兹别克斯坦",
  "刚果(金)": "刚果（金）",
  "民主刚果": "刚果（金）",
};

export const BEIJING_DEDUP_MIN_DATE = "2026-06-19";

const beijingDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function canonicalTeam(name: string): string {
  const n = name.trim().replace(/\s+/g, "").replace(/\(/g, "（").replace(/\)/g, "）");
  return TEAM_ALIASES[n] ?? n;
}

export function getBeijingDateKey(date: Date | string): string {
  return beijingDateFormatter.format(new Date(date));
}
