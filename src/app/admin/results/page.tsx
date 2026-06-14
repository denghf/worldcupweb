"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MARKET_NAMES,
  X1X_LABELS,
  HANDICAP_LABELS,
  RESULT_MAP,
  formatOptionLabel,
  isWinningOption,
  type BetMarket,
} from "@/lib/bet-display";

interface MatchListItem {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  tournamentName: string;
  homeScore: number | null;
  awayScore: number | null;
  halfHomeScore: number | null;
  halfAwayScore: number | null;
  finalHomeScore: number | null;
  finalAwayScore: number | null;
  betCount: number;
  betItemCount: number;
  winCount: number;
  loseCount: number;
  pendingItemCount: number;
  openBetCount: number;
  totalBetAmount: number;
  totalPayout: number;
  hasScore: boolean;
  settled: boolean;
}

interface OddsRow {
  id: number;
  betType: string;
  optionKey: string;
  oddsValue: number;
}

interface BetItemRow {
  id: number;
  betMarket: BetMarket;
  selectedOption: string;
  lockedOdds: number;
  result: string;
  bet: {
    id: number;
    betUid: string;
    betMode: string;
    totalAmount: number;
    status: string;
    actualPayout: number | null;
    user: { nickname: string };
  };
}

interface MatchDetail {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  tournamentName: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  halfHomeScore: number | null;
  halfAwayScore: number | null;
  finalHomeScore: number | null;
  finalAwayScore: number | null;
  odds: OddsRow[];
  betItems: BetItemRow[];
}

export default function ResultsPage() {
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MatchDetail | null>(null);

  const [dateFilter, setDateFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/results")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const rows = data.data || [];
          setMatches(rows);
          setSelectedId((current) => current ?? rows[0]?.id ?? null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    fetch(`/api/admin/results?matchId=${selectedId}`)
      .then((r) => r.json())
      .then((data) => setDetail(data.success ? data.data : null))
      .catch(() => setDetail(null));
  }, [selectedId]);

  const selectedDetail = selectedId != null && detail?.id === selectedId ? detail : null;
  const detailLoading = selectedId != null && detail?.id !== selectedId;

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (dateFilter) {
        const d = new Date(m.kickoffTime);
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (local !== dateFilter) return false;
      }
      if (teamFilter) {
        const q = teamFilter.trim().toLowerCase();
        if (!m.homeTeam.toLowerCase().includes(q) && !m.awayTeam.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [matches, dateFilter, teamFilter]);

  return (
    <div>
      <h2 className="font-display text-lg font-semibold mb-1">赛果查看</h2>
      <p className="text-text-muted text-sm mb-4">按场查看赛果、玩法命中与下注中奖情况</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input-field rounded-lg px-3 py-1.5 text-sm"
        />
        <input
          type="text"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          placeholder="搜索球队"
          className="input-field rounded-lg px-3 py-1.5 text-sm w-44"
        />
        {(dateFilter || teamFilter) && (
          <button
            onClick={() => { setDateFilter(""); setTeamFilter(""); }}
            className="text-xs text-text-muted hover:text-accent"
          >
            清除筛选
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-text-muted text-sm py-8 text-center">暂无赛果，可调整筛选条件</div>
      ) : (
        <div className="flex gap-4 items-start">
          {/* Left: match list */}
          <div className="w-72 shrink-0 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredMatches.map((m) => {
              const active = m.id === selectedId;
              const resultStatus = getResultStatus(m);
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full text-left rounded-xl p-3 transition-all border ${
                    active
                      ? "bg-accent/10 border-accent ring-1 ring-accent/30"
                      : "glass border-transparent hover:bg-bg-hover"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium truncate ${active ? "text-accent" : ""}`}>
                      {m.homeTeam} {m.homeScore ?? "-"}:{m.awayScore ?? "-"} {m.awayTeam}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>
                      {m.halfHomeScore != null && m.halfAwayScore != null
                        ? `半场 ${m.halfHomeScore}:${m.halfAwayScore}`
                        : "半场 -"}
                    </span>
                    <span>
                      {resultStatus.shortLabel}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {new Date(m.kickoffTime).toLocaleString("zh-CN", { month: "2-digit", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}下注 {m.betCount} 笔
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: detail */}
          <div className="flex-1 min-w-0">
            {!selectedId ? (
              <div className="glass rounded-xl p-8 text-center text-text-muted text-sm">
                选择左侧赛事查看详情
              </div>
            ) : detailLoading ? (
              <div className="glass rounded-xl p-8 text-center text-text-muted text-sm">加载中...</div>
            ) : !selectedDetail ? (
              <div className="glass rounded-xl p-8 text-center text-text-muted text-sm">未找到赛事</div>
            ) : (
              <MatchDetailView detail={selectedDetail} summary={matches.find((m) => m.id === selectedId) || null} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getResultStatus(match: MatchListItem | null) {
  if (!match?.hasScore) return { shortLabel: "", badgeLabel: "", summaryLabel: "" };
  if (match.pendingItemCount > 0) {
    return {
      shortLabel: "本场待结算",
      badgeLabel: "赛果已更新，本场投注待结算",
      summaryLabel: "赛果已更新，本场投注仍待结算",
    };
  }
  if (match.openBetCount > 0) {
    return {
      shortLabel: "串关待完赛",
      badgeLabel: "本场已结算，串关待其它场次",
      summaryLabel: "本场投注已结算，部分串关注单需等待其它场次完成后汇总赔付",
    };
  }
  return { shortLabel: "已结算", badgeLabel: "", summaryLabel: "" };
}

function MatchDetailView({ detail, summary }: { detail: MatchDetail; summary: MatchListItem | null }) {
  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    halfHomeScore,
    halfAwayScore,
    finalHomeScore,
    finalAwayScore,
    odds,
    betItems,
  } = detail;

  const hasScore = homeScore !== null && awayScore !== null;
  const hasHalfScore = halfHomeScore !== null && halfAwayScore !== null;
  const resultStatus = getResultStatus(summary);

  const oddsByType: Record<string, OddsRow[]> = {};
  for (const o of odds) {
    if (!oddsByType[o.betType]) oddsByType[o.betType] = [];
    oddsByType[o.betType].push(o);
  }

  return (
    <div className="space-y-3">
      {/* Header + scores */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-semibold">{homeTeam} vs {awayTeam}</div>
            <div className="text-xs text-text-muted mt-0.5">
              {detail.tournamentName} · {new Date(detail.kickoffTime).toLocaleString("zh-CN", { month: "2-digit", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          {resultStatus.badgeLabel && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
              {resultStatus.badgeLabel}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <ScoreBlock label="全场" home={homeScore} away={awayScore} />
          <ScoreBlock label="半场" home={halfHomeScore} away={halfAwayScore} />
          <ScoreBlock label="最终" home={finalHomeScore} away={finalAwayScore} />
        </div>
      </div>

      {/* Market results */}
      <div className="glass rounded-xl p-4">
        <h3 className="font-display text-sm font-semibold mb-3">玩法赛果</h3>
        {!hasScore ? (
          <div className="text-text-muted text-sm">暂无赛果</div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <MarketResultRow
              label="胜平负"
              rows={oddsByType["X1X"]}
              renderLabel={(o) => X1X_LABELS[o.optionKey] || o.optionKey}
              isWinner={(o) => isWinningOption("X1X", o.optionKey, homeScore!, awayScore!, halfHomeScore, halfAwayScore)}
            />
            <MarketResultRow
              label="让球胜平负"
              rows={oddsByType["HANDICAP_X1X"]}
              renderLabel={(o) => {
                const [handicap, option] = o.optionKey.includes(":") ? o.optionKey.split(":") : ["", o.optionKey];
                return `${handicap}${HANDICAP_LABELS[option] || option}`;
              }}
              isWinner={(o) => isWinningOption("HANDICAP_X1X", o.optionKey, homeScore!, awayScore!, halfHomeScore, halfAwayScore)}
            />
            <MarketResultRow
              label="半全场"
              rows={hasHalfScore ? oddsByType["HALF_FULL"] : undefined}
              renderLabel={(o) => o.optionKey}
              isWinner={(o) => isWinningOption("HALF_FULL", o.optionKey, homeScore!, awayScore!, halfHomeScore, halfAwayScore)}
              fallback={hasHalfScore ? undefined : "缺少半场比分"}
            />
            <MarketResultRow
              label="总进球"
              rows={oddsByType["TOTAL_GOALS"]}
              renderLabel={(o) => o.optionKey}
              isWinner={(o) => isWinningOption("TOTAL_GOALS", o.optionKey, homeScore!, awayScore!, halfHomeScore, halfAwayScore)}
            />
            <MarketResultRow
              label="猜比分"
              rows={oddsByType["CORRECT_SCORE"]}
              renderLabel={(o) => o.optionKey}
              isWinner={(o) => isWinningOption("CORRECT_SCORE", o.optionKey, homeScore!, awayScore!, halfHomeScore, halfAwayScore)}
            />
          </div>
        )}
      </div>

      {/* Bets table */}
      <div className="glass rounded-xl p-4">
        <h3 className="font-display text-sm font-semibold mb-3">当场下注</h3>
        {betItems.length === 0 ? (
          <div className="text-text-muted text-sm">本场暂无下注</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-xs">
                  <th className="text-left py-2 px-2 font-medium">玩家</th>
                  <th className="text-left py-2 px-2 font-medium">玩法</th>
                  <th className="text-left py-2 px-2 font-medium">选择</th>
                  <th className="text-right py-2 px-2 font-medium">赔率</th>
                  <th className="text-right py-2 px-2 font-medium">金额</th>
                  <th className="text-left py-2 px-2 font-medium">结果</th>
                </tr>
              </thead>
              <tbody>
                {betItems.map((bi) => {
                  const resultInfo = RESULT_MAP[bi.result] || { label: bi.result, color: "" };
                  const isParlay = bi.bet.betMode === "PARLAY";
                  return (
                    <tr key={bi.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <span>{bi.bet.user?.nickname || "-"}</span>
                          {isParlay && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">串关</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-text-secondary">{MARKET_NAMES[bi.betMarket] || bi.betMarket}</td>
                      <td className={`py-2 px-2 ${bi.result === "WON" ? "text-accent" : ""}`}>{formatOptionLabel(bi.betMarket, bi.selectedOption)}</td>
                      <td className="py-2 px-2 text-right text-text-secondary">{bi.lockedOdds.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">{bi.bet.totalAmount.toFixed(0)}</td>
                      <td className={`py-2 px-2 ${bi.result === "WON" ? "text-accent" : ""}`}>{resultInfo.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="glass rounded-xl p-4">
        <h3 className="font-display text-sm font-semibold mb-3">中奖汇总</h3>
        {resultStatus.summaryLabel ? (
          <div className="text-text-muted text-sm">{resultStatus.summaryLabel}</div>
        ) : (
          <div className="grid grid-cols-4 gap-3 text-center">
            <SummaryCell label="中奖笔数" value={summary?.winCount?.toString() ?? "0"} accent />
            <SummaryCell label="未中奖笔数" value={summary?.loseCount?.toString() ?? "0"} />
            <SummaryCell label="总投注" value={(summary?.totalBetAmount ?? 0).toFixed(0)} />
            <SummaryCell label="总赔付" value={(summary?.totalPayout ?? 0).toFixed(2)} accent />
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBlock({ label, home, away }: { label: string; home: number | null; away: number | null }) {
  return (
    <div className="bg-bg-primary rounded-lg p-2 text-center">
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div className="text-base font-semibold">
        {home !== null && away !== null ? `${home} : ${away}` : "-"}
      </div>
    </div>
  );
}

function MarketResultRow({
  label,
  rows,
  renderLabel,
  isWinner,
  fallback,
}: {
  label: string;
  rows: OddsRow[] | undefined;
  renderLabel: (o: OddsRow) => string;
  isWinner: (o: OddsRow) => boolean;
  fallback?: string;
}) {
  const winner = rows?.find((o) => isWinner(o));
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-text-muted text-xs">{label}</span>
      {winner ? (
        <>
          <span className="text-accent font-medium">{renderLabel(winner)}</span>
          <span className="text-text-muted text-xs">@ {winner.oddsValue.toFixed(2)}</span>
        </>
      ) : (
        <span className="text-text-muted text-xs">{fallback ?? "—"}</span>
      )}
    </div>
  );
}

function SummaryCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-bg-primary rounded-lg p-3">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`text-lg font-semibold ${accent ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
}
