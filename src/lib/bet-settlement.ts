export type SettlementMarket = "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE";

type EvaluateBetSelectionInput = {
  market: SettlementMarket | string;
  selectedOption: string;
  homeScore: number;
  awayScore: number;
  halfHomeScore?: number;
  halfAwayScore?: number;
};

const exactHomeScores = new Set(["1:0", "2:0", "2:1", "3:0", "3:1", "3:2", "4:0", "4:1", "4:2", "5:0", "5:1", "5:2"]);
const exactDrawScores = new Set(["0:0", "1:1", "2:2", "3:3"]);
const exactAwayScores = new Set(["0:1", "0:2", "1:2", "0:3", "1:3", "2:3", "0:4", "1:4", "2:4", "0:5", "1:5", "2:5"]);

export function evaluateBetSelection({
  market,
  selectedOption,
  homeScore,
  awayScore,
  halfHomeScore,
  halfAwayScore,
}: EvaluateBetSelectionInput): boolean | null {
  switch (market) {
    case "X1X":
      return selectedOption === matchResult(homeScore, awayScore);
    case "HANDICAP_X1X":
      return evaluateHandicap(selectedOption, homeScore, awayScore);
    case "HALF_FULL":
      if (halfHomeScore === undefined || halfAwayScore === undefined) return null;
      return selectedOption === `${resultText(halfHomeScore, halfAwayScore)}${resultText(homeScore, awayScore)}`;
    case "TOTAL_GOALS":
      return evaluateTotalGoals(selectedOption, homeScore + awayScore);
    case "CORRECT_SCORE":
      return evaluateCorrectScore(selectedOption, homeScore, awayScore);
    default:
      return false;
  }
}

function matchResult(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

function resultText(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return "胜";
  if (homeScore < awayScore) return "负";
  return "平";
}

function evaluateHandicap(selectedOption: string, homeScore: number, awayScore: number) {
  const [handicapRaw, option] = selectedOption.includes(":")
    ? selectedOption.split(":")
    : ["0", selectedOption];
  const handicap = Number(handicapRaw);
  if (Number.isNaN(handicap)) return false;
  return option === matchResult(homeScore + handicap, awayScore);
}

function evaluateTotalGoals(selectedOption: string, totalGoals: number) {
  if (selectedOption.endsWith("+")) {
    const minimum = Number.parseInt(selectedOption, 10);
    return !Number.isNaN(minimum) && totalGoals >= minimum;
  }
  if (selectedOption.endsWith("球+")) {
    const minimum = Number.parseInt(selectedOption, 10);
    return !Number.isNaN(minimum) && totalGoals >= minimum;
  }
  const exact = Number.parseInt(selectedOption, 10);
  return !Number.isNaN(exact) && totalGoals === exact;
}

function evaluateCorrectScore(selectedOption: string, homeScore: number, awayScore: number) {
  if (selectedOption.includes(":")) {
    const [home, away] = selectedOption.split(":").map(Number);
    return home === homeScore && away === awayScore;
  }

  const score = `${homeScore}:${awayScore}`;
  if (selectedOption === "胜其它") return homeScore > awayScore && !exactHomeScores.has(score);
  if (selectedOption === "平其它") return homeScore === awayScore && !exactDrawScores.has(score);
  if (selectedOption === "负其它") return homeScore < awayScore && !exactAwayScores.has(score);

  return false;
}
