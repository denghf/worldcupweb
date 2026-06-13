export type BetMarket = "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE";

export const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  APPROVED: { label: "已下注", badge: "badge-active" },
  WON: { label: "已中奖", badge: "badge-won" },
  LOST: { label: "未中奖", badge: "badge-lost" },
  CANCELLED: { label: "已取消", badge: "badge-cancelled" },
};

export const MARKET_NAMES: Record<string, string> = {
  X1X: "胜平负",
  HANDICAP_X1X: "让球胜平负",
  HALF_FULL: "半全场",
  TOTAL_GOALS: "总进球",
  CORRECT_SCORE: "猜比分",
};

export const X1X_LABELS: Record<string, string> = { home: "胜", draw: "平", away: "负" };
export const HANDICAP_LABELS: Record<string, string> = { home: "让胜", draw: "让平", away: "让负" };

export const RESULT_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待定", color: "text-text-muted" },
  WON: { label: "命中", color: "text-accent" },
  LOST: { label: "未中", color: "text-red" },
  CANCELLED: { label: "取消", color: "text-text-muted" },
};

const exactHomeScores = new Set(["1:0", "2:0", "2:1", "3:0", "3:1", "3:2", "4:0", "4:1", "4:2", "5:0", "5:1", "5:2"]);
const exactDrawScores = new Set(["0:0", "1:1", "2:2", "3:3"]);
const exactAwayScores = new Set(["0:1", "0:2", "1:2", "0:3", "1:3", "2:3", "0:4", "1:4", "2:4", "0:5", "1:5", "2:5"]);

export function formatOptionLabel(market: string, option: string): string {
  if (market === "X1X") return X1X_LABELS[option] || option;
  if (market === "HANDICAP_X1X") {
    const [handicap, key] = option.includes(":") ? option.split(":") : ["", option];
    return `${handicap}${HANDICAP_LABELS[key] || key}`;
  }
  return option;
}

export function matchResult(homeScore: number, awayScore: number): "home" | "draw" | "away" {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

export function resultText(homeScore: number, awayScore: number): string {
  if (homeScore > awayScore) return "胜";
  if (homeScore < awayScore) return "负";
  return "平";
}

export function isWinningOption(
  market: string,
  optionKey: string,
  homeScore: number,
  awayScore: number,
  halfHomeScore: number | null,
  halfAwayScore: number | null
): boolean {
  switch (market) {
    case "X1X":
      return optionKey === matchResult(homeScore, awayScore);
    case "HANDICAP_X1X": {
      const [handicapRaw, option] = optionKey.includes(":")
        ? optionKey.split(":")
        : ["0", optionKey];
      const handicap = Number(handicapRaw);
      if (Number.isNaN(handicap)) return false;
      return option === matchResult(homeScore + handicap, awayScore);
    }
    case "HALF_FULL": {
      if (halfHomeScore === null || halfAwayScore === null) return false;
      return optionKey === `${resultText(halfHomeScore, halfAwayScore)}${resultText(homeScore, awayScore)}`;
    }
    case "TOTAL_GOALS": {
      const total = homeScore + awayScore;
      if (optionKey.endsWith("+")) {
        const minimum = Number.parseInt(optionKey, 10);
        return !Number.isNaN(minimum) && total >= minimum;
      }
      if (optionKey.endsWith("球+")) {
        const minimum = Number.parseInt(optionKey, 10);
        return !Number.isNaN(minimum) && total >= minimum;
      }
      const exact = Number.parseInt(optionKey, 10);
      return !Number.isNaN(exact) && total === exact;
    }
    case "CORRECT_SCORE": {
      if (optionKey.includes(":")) {
        const [home, away] = optionKey.split(":").map(Number);
        return home === homeScore && away === awayScore;
      }
      const score = `${homeScore}:${awayScore}`;
      if (optionKey === "胜其它") return homeScore > awayScore && !exactHomeScores.has(score);
      if (optionKey === "平其它") return homeScore === awayScore && !exactDrawScores.has(score);
      if (optionKey === "负其它") return homeScore < awayScore && !exactAwayScores.has(score);
      return false;
    }
    default:
      return false;
  }
}
