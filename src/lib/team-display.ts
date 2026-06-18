const TEAM_DISPLAY_NAMES: Record<string, string> = {
  沙特: "沙特阿拉伯",
  "刚果（金）": "民主刚果",
  "刚果(金)": "民主刚果",
};

export function displayTeamName(name: string | null | undefined) {
  if (!name) return "?";
  return TEAM_DISPLAY_NAMES[name] ?? name;
}
