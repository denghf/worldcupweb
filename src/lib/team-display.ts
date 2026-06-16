const TEAM_DISPLAY_NAMES: Record<string, string> = {
  沙特: "沙特阿拉伯",
};

export function displayTeamName(name: string | null | undefined) {
  if (!name) return "?";
  return TEAM_DISPLAY_NAMES[name] ?? name;
}
