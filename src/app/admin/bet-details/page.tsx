"use client";

import { useState, useEffect } from "react";

interface OddsRow {
  id: number;
  matchId: number;
  betType: string;
  optionKey: string;
  oddsValue: number;
}

interface MatchDetail {
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  homeScore: number | null;
  awayScore: number | null;
  halfHomeScore: number | null;
  halfAwayScore: number | null;
  odds: OddsRow[];
}

interface BetItem {
  match: MatchDetail;
  betMarket: string;
  selectedOption: string;
  lockedOdds: number;
  result: string;
}

interface Bet {
  id: number;
  betUid: string;
  user: { nickname: string };
  betMode: string;
  totalAmount: number;
  lockedTotalOdds: number;
  potentialPayout: number;
  actualPayout: number | null;
  status: string;
  createdAt: string;
  settledAt: string | null;
  items: BetItem[];
}

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  APPROVED: { label: "已下注", badge: "badge-active" },
  WON: { label: "已中奖", badge: "badge-won" },
  LOST: { label: "未中奖", badge: "badge-lost" },
  CANCELLED: { label: "已取消", badge: "badge-cancelled" },
};

const MARKET_NAMES: Record<string, string> = {
  X1X: "胜平负",
  HANDICAP_X1X: "让球胜平负",
  HALF_FULL: "半全场",
  TOTAL_GOALS: "总进球",
  CORRECT_SCORE: "猜比分",
};

const X1X_LABELS: Record<string, string> = { home: "胜", draw: "平", away: "负" };
const HANDICAP_LABELS: Record<string, string> = { home: "让胜", draw: "让平", away: "让负" };

const RESULT_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待定", color: "text-text-muted" },
  WON: { label: "命中", color: "text-accent" },
  LOST: { label: "未中", color: "text-red" },
  CANCELLED: { label: "取消", color: "text-text-muted" },
};

const exactHomeScores = new Set(["1:0", "2:0", "2:1", "3:0", "3:1", "3:2", "4:0", "4:1", "4:2", "5:0", "5:1", "5:2"]);
const exactDrawScores = new Set(["0:0", "1:1", "2:2", "3:3"]);
const exactAwayScores = new Set(["0:1", "0:2", "1:2", "0:3", "1:3", "2:3", "0:4", "1:4", "2:4", "0:5", "1:5", "2:5"]);

type Filter = "ALL" | "APPROVED" | "WON" | "LOST";

export default function BetDetailsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [expandedBet, setExpandedBet] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/bets")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBets(
            (data.data || []).map((b: Bet) => ({
              ...b,
              totalAmount: Number(b.totalAmount),
              lockedTotalOdds: Number(b.lockedTotalOdds),
              potentialPayout: Number(b.potentialPayout),
              actualPayout: b.actualPayout ? Number(b.actualPayout) : null,
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? bets : bets.filter((b) => b.status === filter);

  return (
    <div className="max-w-4xl">
      <h2 className="font-display text-lg font-semibold mb-1">下注详情</h2>
      <p className="text-text-muted text-xs mb-4">查看每笔下注的详细内容</p>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {([
          { key: "ALL", label: "全部" },
          { key: "APPROVED", label: "已下注" },
          { key: "WON", label: "已中奖" },
          { key: "LOST", label: "未中奖" },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.key
                ? "bg-accent/15 text-accent border border-accent/30"
                : "glass text-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-text-muted text-sm py-8 text-center">暂无下注记录</div>
          ) : (
            filtered.map((bet) => {
              const statusInfo = STATUS_MAP[bet.status] ?? { label: bet.status, badge: "" };
              const isExpanded = expandedBet === bet.id;

              return (
                <div key={bet.id} className="glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedBet(isExpanded ? null : bet.id)}
                    className="w-full px-4 py-3 text-left"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{bet.user?.nickname || "未知"}</span>
                        {bet.betMode === "PARLAY" && (
                          <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
                            串关 ×{bet.items.length}
                          </span>
                        )}
                        <span className="text-text-muted text-[10px]">{bet.betUid}</span>
                      </div>
                      <span className={`${statusInfo.badge} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">
                        {new Date(bet.createdAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="num text-text-secondary">赔率 {bet.lockedTotalOdds.toFixed(2)}</span>
                        <span className="num font-medium">{bet.totalAmount}</span>
                        {bet.status === "WON" && bet.actualPayout !== null && (
                          <span className="num text-accent font-semibold">+{Math.round(bet.actualPayout).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-border pt-3 space-y-3 animate-fade-in-up">
                      {bet.items.map((item, j) => {
                        const resultInfo = RESULT_MAP[item.result] ?? { label: item.result, color: "" };
                        return (
                          <div key={j} className="bg-bg-primary rounded-lg overflow-hidden">
                            {/* Match header with scores */}
                            <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{item.match.homeTeam} vs {item.match.awayTeam}</span>
                                {item.match.homeScore !== null && item.match.awayScore !== null && (
                                  <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
                                    全场 {item.match.homeScore}:{item.match.awayScore}
                                  </span>
                                )}
                                {item.match.halfHomeScore !== null && item.match.halfAwayScore !== null && (
                                  <span className="text-xs bg-text-muted/10 text-text-muted px-1.5 py-0.5 rounded">
                                    半场 {item.match.halfHomeScore}:{item.match.halfAwayScore}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-muted">{MARKET_NAMES[item.betMarket] ?? item.betMarket}</span>
                                <span className="text-accent text-xs">{formatOptionLabel(item.betMarket, item.selectedOption)}</span>
                                <span className="num text-text-muted text-xs">@ {Number(item.lockedOdds).toFixed(2)}</span>
                                <span className={`text-xs ${resultInfo.color}`}>{resultInfo.label}</span>
                              </div>
                            </div>

                            {/* Full odds grid */}
                            <div className="px-3 py-2 space-y-2">
                              <MatchOddsGrid
                                odds={item.match.odds}
                                homeScore={item.match.homeScore}
                                awayScore={item.match.awayScore}
                                halfHomeScore={item.match.halfHomeScore}
                                halfAwayScore={item.match.halfAwayScore}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-text-muted">潜在赔付</span>
                        <span className="num text-text-secondary">{Math.round(bet.potentialPayout).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function MatchOddsGrid({
  odds,
  homeScore,
  awayScore,
  halfHomeScore,
  halfAwayScore,
}: {
  odds: OddsRow[];
  homeScore: number | null;
  awayScore: number | null;
  halfHomeScore: number | null;
  halfAwayScore: number | null;
}) {
  const byType: Record<string, OddsRow[]> = {};
  for (const o of odds) {
    if (!byType[o.betType]) byType[o.betType] = [];
    byType[o.betType].push(o);
  }

  const hasScores = homeScore !== null && awayScore !== null;

  return (
    <div className="space-y-2">
      {byType["X1X"] && (
        <OddsDisplaySection title="胜平负" columns="grid-cols-3">
          {byType["X1X"].map((o) => (
            <OddsResultButton
              key={o.optionKey}
              label={X1X_LABELS[o.optionKey] || o.optionKey}
              odds={Number(o.oddsValue)}
              isWinner={hasScores && isWinningOption("X1X", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
            />
          ))}
        </OddsDisplaySection>
      )}

      {byType["HANDICAP_X1X"] && (
        <OddsDisplaySection title="让球胜平负" columns="grid-cols-3">
          {byType["HANDICAP_X1X"].map((o) => {
            const [handicap, option] = o.optionKey.includes(":") ? o.optionKey.split(":") : ["", o.optionKey];
            return (
              <OddsResultButton
                key={o.optionKey}
                label={`${handicap}${HANDICAP_LABELS[option] || option}`}
                odds={Number(o.oddsValue)}
                isWinner={hasScores && isWinningOption("HANDICAP_X1X", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
              />
            );
          })}
        </OddsDisplaySection>
      )}

      {byType["HALF_FULL"] && (
        <OddsDisplaySection title="半全场" columns="grid-cols-3">
          {byType["HALF_FULL"].map((o) => (
            <OddsResultButton
              key={o.optionKey}
              label={o.optionKey}
              odds={Number(o.oddsValue)}
              isWinner={hasScores && halfHomeScore !== null && halfAwayScore !== null &&
                isWinningOption("HALF_FULL", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
            />
          ))}
        </OddsDisplaySection>
      )}

      {byType["TOTAL_GOALS"] && (
        <OddsDisplaySection title="总进球" columns="grid-cols-4">
          {byType["TOTAL_GOALS"].map((o) => (
            <OddsResultButton
              key={o.optionKey}
              label={o.optionKey}
              odds={Number(o.oddsValue)}
              isWinner={hasScores && isWinningOption("TOTAL_GOALS", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
            />
          ))}
        </OddsDisplaySection>
      )}

      {byType["CORRECT_SCORE"] && (
        <OddsDisplaySection title="猜比分" columns="grid-cols-4">
          {byType["CORRECT_SCORE"].map((o) => (
            <OddsResultButton
              key={o.optionKey}
              label={o.optionKey}
              odds={Number(o.oddsValue)}
              isWinner={hasScores && isWinningOption("CORRECT_SCORE", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
            />
          ))}
        </OddsDisplaySection>
      )}
    </div>
  );
}

function OddsDisplaySection({ title, columns, children }: { title: string; columns: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1 text-[10px] font-semibold text-text-muted">{title}</div>
      <div className={`grid ${columns} gap-1`}>{children}</div>
    </section>
  );
}

function OddsResultButton({
  label,
  odds,
  isWinner,
}: {
  label: string;
  odds: number;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-1 px-1.5 py-1.5 text-center text-[10px] rounded border ${
        isWinner
          ? "bg-red/15 text-red border-red/40 font-semibold"
          : "bg-bg-surface text-text-secondary border-border/50"
      }`}
    >
      {isWinner && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span>{label}</span>
      <span className={`num ${isWinner ? "text-red" : ""}`}>{odds.toFixed(2)}</span>
    </div>
  );
}

function formatOptionLabel(market: string, option: string) {
  if (market === "X1X") return X1X_LABELS[option] || option;
  if (market === "HANDICAP_X1X") {
    const [handicap, key] = option.includes(":") ? option.split(":") : ["", option];
    return `${handicap}${HANDICAP_LABELS[key] || key}`;
  }
  return option;
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

function isWinningOption(
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
