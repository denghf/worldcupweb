"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  kickoffTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  halfHomeScore: number | null;
  halfAwayScore: number | null;
  finalHomeScore: number | null;
  finalAwayScore: number | null;
  tournamentName: string;
  odds: {
    x1x: Record<string, number>;
    handicapX1x: Record<string, number>;
    halfFull: { label: string; value: number }[];
    totalGoals: { label: string; value: number }[];
    correctScore: { label: string; value: number }[];
  };
}

const beijingTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "未开赛",
  SEALED: "已封盘",
  LIVE: "进行中",
  FINISHED: "已结束",
};

const DEFAULT_BET_AMOUNT = "5";
const BET_AMOUNT_STEP = 5;

function getMatchDisplayStatus(match: Match) {
  const now = Date.now();
  const kickoff = new Date(match.kickoffTime).getTime();
  const hasStarted = now >= kickoff;

  if (match.status === "FINISHED") {
    return { label: STATUS_LABELS.FINISHED, isFinished: true, isLive: false, isSealed: true };
  }
  if (match.status === "LIVE" || (match.status === "UPCOMING" && hasStarted)) {
    return { label: STATUS_LABELS.LIVE, isFinished: false, isLive: true, isSealed: true };
  }
  if (match.status === "SEALED") {
    return { label: STATUS_LABELS.SEALED, isFinished: false, isLive: false, isSealed: true };
  }
  return { label: STATUS_LABELS.UPCOMING, isFinished: false, isLive: false, isSealed: false };
}

const TEAM_MARKS: Record<string, string> = {
  墨西哥: "🇲🇽",
  南非: "🇿🇦",
  韩国: "🇰🇷",
  捷克: "🇨🇿",
  加拿大: "🇨🇦",
  波黑: "🇧🇦",
  卡塔尔: "🇶🇦",
  瑞士: "🇨🇭",
  巴西: "🇧🇷",
  摩洛哥: "🇲🇦",
  海地: "🇭🇹",
  苏格兰: "🏴",
  美国: "🇺🇸",
  巴拉圭: "🇵🇾",
  澳大利亚: "🇦🇺",
  土耳其: "🇹🇷",
  德国: "🇩🇪",
  库拉索: "🇨🇼",
  科特迪瓦: "🇨🇮",
  厄瓜多尔: "🇪🇨",
  荷兰: "🇳🇱",
  日本: "🇯🇵",
  瑞典: "🇸🇪",
  突尼斯: "🇹🇳",
  比利时: "🇧🇪",
  埃及: "🇪🇬",
  伊朗: "🇮🇷",
  新西兰: "🇳🇿",
  西班牙: "🇪🇸",
  佛得角: "🇨🇻",
  沙特: "🇸🇦",
  乌拉圭: "🇺🇾",
  法国: "🇫🇷",
  塞内加尔: "🇸🇳",
  伊拉克: "🇮🇶",
  挪威: "🇳🇴",
  阿根廷: "🇦🇷",
  阿尔及利亚: "🇩🇿",
  奥地利: "🇦🇹",
  约旦: "🇯🇴",
  葡萄牙: "🇵🇹",
  "刚果（金）": "🇨🇩",
  乌兹别克斯坦: "🇺🇿",
  哥伦比亚: "🇨🇴",
  英格兰: "🏴",
  克罗地亚: "🇭🇷",
  加纳: "🇬🇭",
  巴拿马: "🇵🇦",
};

const exactHomeScores = new Set(["1:0", "2:0", "2:1", "3:0", "3:1", "3:2", "4:0", "4:1", "4:2", "5:0", "5:1", "5:2"]);
const exactDrawScores = new Set(["0:0", "1:1", "2:2", "3:3"]);
const exactAwayScores = new Set(["0:1", "0:2", "1:2", "0:3", "1:3", "2:3", "0:4", "1:4", "2:4", "0:5", "1:5", "2:5"]);

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

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.id);

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOdds, setSelectedOdds] = useState<Set<string>>(() => new Set());
  const [loggedIn, setLoggedIn] = useState(false);
  const [betAmounts, setBetAmounts] = useState<Record<string, string>>({});
  const [betSubmitting, setBetSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const found = (res.data || []).find((m: Match) => m.id === matchId);
          setMatch(found || null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    const token = localStorage.getItem("player_token");
    if (!token) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => setLoggedIn(Boolean(res.success && res.data.loggedIn)))
      .catch(() => setLoggedIn(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-full bg-white px-4 py-2 text-sm text-text-muted shadow-sm">加载中...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">⚽</div>
        <div className="mb-1 text-sm font-bold text-text-primary">比赛不存在</div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
        >
          返回首页
        </button>
      </div>
    );
  }

  const timeStr = beijingTimeFormatter.format(new Date(match.kickoffTime));
  const { label: statusLabel, isFinished, isLive } = getMatchDisplayStatus(match);
  const canSelect = !isFinished && !isLive;
  const x1x = match.odds?.x1x || {};
  const handicapX1x = match.odds?.handicapX1x || {};
  const halfFull = match.odds?.halfFull || [];
  const totalGoals = match.odds?.totalGoals || [];
  const correctScore = match.odds?.correctScore || [];
  const hasScores = match.homeScore !== null && match.awayScore !== null;

  const getSelectedOddValue = (key: string) => {
    const [betType, ...optionParts] = key.split(":");
    const optionKey = optionParts.join(":");
    if (betType === "X1X") return x1x[optionKey];
    if (betType === "HANDICAP_X1X") return handicapX1x[optionKey];
    if (betType === "CORRECT_SCORE") return correctScore.find((o) => o.label === optionKey)?.value;
    if (betType === "TOTAL_GOALS") return totalGoals.find((o) => o.label === optionKey)?.value;
    if (betType === "HALF_FULL") return halfFull.find((o) => o.label === optionKey)?.value;
    return undefined;
  };

  const selectedItems = [...selectedOdds].map((key) => {
    const [betType, ...optionParts] = key.split(":");
    const optionKey = optionParts.join(":");
    const odds = getSelectedOddValue(key) ?? 0;
    const amount = Number(betAmounts[key] || "");
    return { key, betType, optionKey, odds, amount };
  }).filter((item) => item.odds > 0);
  const selectedTotalAmount = selectedItems.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0);
  const selectedTotalPayout = selectedItems.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount * item.odds : 0), 0);

  const submitBet = async () => {
    const token = localStorage.getItem("player_token");
    if (!loggedIn || !token) return router.push("/profile/login");
    if (selectedItems.length === 0) return;
    if (selectedItems.some((item) => !Number.isFinite(item.amount) || item.amount <= 0)) return alert("请为每个选项填写有效下注倍数");
    if (!confirm(`确认投注 ${selectedItems.length} 注，共 ${selectedTotalAmount.toFixed(1)} 记分？预计赔付 ${selectedTotalPayout.toFixed(1)}`)) return;
    setBetSubmitting(true);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          matchId: match.id,
          selections: selectedItems.map((item) => ({ betType: item.betType, optionKey: item.optionKey, amount: item.amount })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("投注成功！");
        router.push("/profile");
      } else {
        alert(data.error || "投注失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setBetSubmitting(false);
    }
  };

  const updateBetAmount = (key: string, amount: string) => {
    setBetAmounts((amounts) => ({ ...amounts, [key]: amount }));
  };

  const stepBetAmount = (key: string, direction: -1 | 1) => {
    setBetAmounts((amounts) => {
      const current = Number(amounts[key] || DEFAULT_BET_AMOUNT);
      const next = Math.max(BET_AMOUNT_STEP, (Number.isFinite(current) ? current : BET_AMOUNT_STEP) + direction * BET_AMOUNT_STEP);
      return { ...amounts, [key]: String(next) };
    });
  };

  const toggleOdd = (key: string) => {
    if (!canSelect) return;
    setSelectedOdds((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
        setBetAmounts((amounts) => {
          const copied = { ...amounts };
          delete copied[key];
          return copied;
        });
      } else {
        next.add(key);
        setBetAmounts((amounts) => ({ ...amounts, [key]: amounts[key] || DEFAULT_BET_AMOUNT }));
      }
      return next;
    });
  };

  return (
    <div className="bg-pattern px-3 pb-4 pt-3">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <div>
          <div className="text-[10px] font-semibold text-accent">ODDS DETAIL</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="text-base font-black text-text-primary">赔率详情</h1>
            {canSelect && (
              <>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedOdds.size > 0 ? "bg-accent text-white" : "bg-bg-surface text-text-muted"}`}>
                  已选 {selectedOdds.size}
                </span>
                {selectedOdds.size === 0 && (
                  <span className="rounded-full bg-bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                    {loggedIn ? "点击赔率进行投注" : "登录后可投注，当前可多选截图"}
                  </span>
                )}
              </>
            )}
            {!canSelect && (
              <span className="rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-semibold text-red">红色勾选为命中选项</span>
            )}
          </div>
        </div>
        {canSelect && selectedOdds.size > 0 && (
          <button
            type="button"
            onClick={() => { setSelectedOdds(new Set()); setBetAmounts({}); }}
            className="ml-auto h-8 rounded-full border border-border bg-white px-2.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            清空
          </button>
        )}
      </div>

      {/* Match info */}
      <section className="mb-3 overflow-hidden rounded-[10px] bg-white p-3 shadow-[0_4px_18px_rgba(31,37,48,0.06)] ring-1 ring-border">
        <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-text-muted">
          <span>{match.tournamentName}</span>
          <span className="num text-text-secondary">{timeStr}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamBlock align="left" name={match.homeTeam} logo={match.homeTeamLogo} compact />
          <div className="min-w-14 text-center">
            {isFinished && match.homeScore !== null ? (
              <div className="px-3 py-1.5">
                <span className="num text-2xl font-black text-text-primary">{match.finalHomeScore ?? match.homeScore}</span>
                <span className="mx-1.5 text-lg font-bold text-text-muted">:</span>
                <span className="num text-2xl font-black text-text-primary">{match.finalAwayScore ?? match.awayScore}</span>
              </div>
            ) : (
              <div className="rounded-full border border-border bg-bg-surface px-3 py-1 text-[11px] font-black text-text-muted">VS</div>
            )}
            <div className={`mt-1 text-[10px] font-semibold ${isFinished ? "text-text-muted" : isLive ? "text-accent" : "text-[#1677ff]"}`}>{statusLabel}</div>
            {isFinished && match.homeScore !== null && (
              <div className="mt-1 text-[10px] text-text-muted">
                <span className="num">半场 {match.halfHomeScore ?? "-"}:{match.halfAwayScore ?? "-"}</span>
                <span className="mx-1">·</span>
                <span className="num">90分钟 {match.homeScore}:{match.awayScore}</span>
              </div>
            )}
          </div>
          <TeamBlock align="right" name={match.awayTeam} logo={match.awayTeamLogo} compact />
        </div>
      </section>

      {canSelect && loggedIn && selectedItems.length > 0 && (
        <section className="mb-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-black text-text-primary">已选投注</h2>
            <div className="num text-xs font-bold text-accent">共 {selectedTotalAmount.toFixed(1)} · 预计 {selectedTotalPayout.toFixed(1)}</div>
          </div>
          <div className="space-y-2">
            {selectedItems.map((item) => {
              const payout = Number.isFinite(item.amount) ? item.amount * item.odds : 0;
              return (
                <div key={item.key} className="grid grid-cols-[1fr_54px_auto_60px] items-center gap-2 rounded-xl bg-bg-surface px-2.5 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-bold text-text-muted">{formatMarketName(item.betType)}</div>
                    <div className="truncate text-xs font-black text-text-primary">{formatBetOption(item.betType, item.optionKey)}</div>
                  </div>
                  <div className="num text-right text-xs font-black text-accent">@{item.odds.toFixed(2)}</div>
                  <div className="flex items-center rounded-lg border border-border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                    <button
                      type="button"
                      onClick={() => stepBetAmount(item.key, -1)}
                      className="flex h-8 w-7 items-center justify-center rounded-l-lg text-sm font-black text-text-secondary transition-colors hover:bg-accent hover:text-white active:bg-accent-dim"
                      aria-label="减少倍数"
                    >
                      -
                    </button>
                    <input
                      value={betAmounts[item.key] || ""}
                      onChange={(e) => updateBetAmount(item.key, e.target.value)}
                      inputMode="decimal"
                      className="num h-8 w-[30px] border-x border-border bg-transparent px-0 text-center text-xs font-black text-text-primary outline-none"
                      placeholder="5"
                    />
                    <button
                      type="button"
                      onClick={() => stepBetAmount(item.key, 1)}
                      className="flex h-8 w-7 items-center justify-center rounded-r-lg text-sm font-black text-text-secondary transition-colors hover:bg-accent hover:text-white active:bg-accent-dim"
                      aria-label="增加倍数"
                    >
                      +
                    </button>
                  </div>
                  <div className="num text-right text-xs font-black text-accent">{payout.toFixed(1)}</div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={submitBet}
            disabled={betSubmitting}
            className="btn-primary mt-3 w-full rounded-xl py-3 text-sm disabled:opacity-40"
          >
            {betSubmitting ? "提交中..." : `确认投注 ${selectedItems.length} 注`}
          </button>
        </section>
      )}

      {/* Odds grids */}
      <div className="space-y-1.5">
        <MarketGrid title="胜平负" columns="grid-cols-3">
          <ExpandedOddsCell label="胜" value={x1x.home} dense
            selected={canSelect && selectedOdds.has("X1X:home")}
            isWinner={isFinished && hasScores && isWinningOption("X1X", "home", match.homeScore!, match.awayScore!, match.halfHomeScore, match.halfAwayScore)}
            onToggle={canSelect ? () => toggleOdd("X1X:home") : undefined}
          />
          <ExpandedOddsCell label="平" value={x1x.draw} dense
            selected={canSelect && selectedOdds.has("X1X:draw")}
            isWinner={isFinished && hasScores && isWinningOption("X1X", "draw", match.homeScore!, match.awayScore!, match.halfHomeScore, match.halfAwayScore)}
            onToggle={canSelect ? () => toggleOdd("X1X:draw") : undefined}
          />
          <ExpandedOddsCell label="负" value={x1x.away} dense
            selected={canSelect && selectedOdds.has("X1X:away")}
            isWinner={isFinished && hasScores && isWinningOption("X1X", "away", match.homeScore!, match.awayScore!, match.halfHomeScore, match.halfAwayScore)}
            onToggle={canSelect ? () => toggleOdd("X1X:away") : undefined}
          />
        </MarketGrid>

        {Object.keys(handicapX1x).length > 0 && (
          <MarketGrid title="让球胜平负" columns="grid-cols-3">
            {Object.entries(handicapX1x).map(([key, value]) => {
              const selectionKey = `HANDICAP_X1X:${key}`;
              return (
                <ExpandedOddsCell key={key} label={formatHandicapLabel(key)} value={value} dense
                  selected={canSelect && selectedOdds.has(selectionKey)}
                  isWinner={isFinished && hasScores && isWinningOption("HANDICAP_X1X", key, match.homeScore!, match.awayScore!, match.halfHomeScore, match.halfAwayScore)}
                  onToggle={canSelect ? () => toggleOdd(selectionKey) : undefined}
                />
              );
            })}
          </MarketGrid>
        )}

        {correctScore.length > 0 && (
          <MarketGrid title="比分" columns="grid-cols-7">
            {correctScore.map((score) => {
              const selectionKey = `CORRECT_SCORE:${score.label}`;
              return (
                <ExpandedOddsCell key={score.label} label={score.label} value={score.value} dense
                  selected={canSelect && selectedOdds.has(selectionKey)}
                  isWinner={isFinished && hasScores && isWinningOption("CORRECT_SCORE", score.label, match.homeScore!, match.awayScore!, match.halfHomeScore, match.halfAwayScore)}
                  onToggle={canSelect ? () => toggleOdd(selectionKey) : undefined}
                />
              );
            })}
          </MarketGrid>
        )}

        {totalGoals.length > 0 && (
          <MarketGrid title="总进球" columns="grid-cols-8">
            {totalGoals.map((goal) => {
              const selectionKey = `TOTAL_GOALS:${goal.label}`;
              return (
                <ExpandedOddsCell key={goal.label} label={goal.label} value={goal.value} dense
                  selected={canSelect && selectedOdds.has(selectionKey)}
                  isWinner={isFinished && hasScores && isWinningOption("TOTAL_GOALS", goal.label, match.homeScore!, match.awayScore!, match.halfHomeScore, match.halfAwayScore)}
                  onToggle={canSelect ? () => toggleOdd(selectionKey) : undefined}
                />
              );
            })}
          </MarketGrid>
        )}

        {halfFull.length > 0 && (
          <MarketGrid title="半全场" columns="grid-cols-3">
            {halfFull.map((option) => {
              const selectionKey = `HALF_FULL:${option.label}`;
              return (
                <ExpandedOddsCell key={option.label} label={option.label} value={option.value} dense
                  selected={canSelect && selectedOdds.has(selectionKey)}
                  isWinner={isFinished && hasScores && match.halfHomeScore !== null && match.halfAwayScore !== null &&
                    isWinningOption("HALF_FULL", option.label, match.homeScore!, match.awayScore!, match.halfHomeScore, match.halfAwayScore)}
                  onToggle={canSelect ? () => toggleOdd(selectionKey) : undefined}
                />
              );
            })}
          </MarketGrid>
        )}
      </div>
    </div>
  );
}

function TeamBlock({ align, name, logo, compact = false }: { align: "left" | "right"; name: string; logo: string | null; compact?: boolean }) {
  const mark = logo || TEAM_MARKS[name] || "🏳️";

  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end text-right" : ""}`}>
      {align === "left" && <span className={`flag-badge shrink-0 ${compact ? "h-8 w-8 text-lg" : "text-xl"}`}>{mark}</span>}
      <div className="min-w-0">
        <div className={`${compact ? "text-xs" : "text-sm"} truncate font-extrabold text-text-primary`}>{name}</div>
        <div className="mt-0.5 text-[10px] font-semibold text-text-muted">{align === "left" ? "主" : "客"}</div>
      </div>
      {align === "right" && <span className={`flag-badge shrink-0 ${compact ? "h-8 w-8 text-lg" : "text-xl"}`}>{mark}</span>}
    </div>
  );
}

function ExpandedOddsCell({
  label,
  value,
  dense = false,
  selected = false,
  isWinner = false,
  onToggle,
}: {
  label: string;
  value?: number;
  dense?: boolean;
  selected?: boolean;
  isWinner?: boolean;
  onToggle?: () => void;
}) {
  const content = (
    <>
      <span className={`text-[10px] font-semibold leading-none ${isWinner || selected ? "text-white" : "text-text-primary"}`}>{label}</span>
      <span className={`num mt-0.5 text-[10px] leading-none ${isWinner || selected ? "text-white/90" : "text-text-secondary"}`}>{value?.toFixed(2) ?? "-"}</span>
    </>
  );
  const className = `expanded-odds-cell relative flex flex-col items-center justify-center border-r border-b px-0.5 text-center first:rounded-tl-[5px] ${dense ? "h-8 py-0.5" : "min-h-10 py-1"} ${isWinner || selected ? "selected border-accent" : "border-border/70"}`;

  if (!onToggle) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" onClick={onToggle} className={`${className} transition-all active:scale-[0.98]`} aria-pressed={selected}>
      {content}
    </button>
  );
}

function MarketGrid({ title, columns, children }: { title: string; columns: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[6px] bg-white shadow-[0_1px_3px_rgba(31,37,48,0.04)] ring-1 ring-border/70">
      <div className="flex h-7 items-center gap-1.5 border-b border-border/70 bg-white px-2">
        <span className="h-3.5 w-0.5 rounded-full bg-accent" />
        <h3 className="text-[11px] font-bold text-text-primary">{title}</h3>
      </div>
      <div className={`grid ${columns} -mr-px -mb-px overflow-hidden`}>{children}</div>
    </section>
  );
}

function formatHandicapLabel(key: string) {
  const labels: Record<string, string> = { home: "让胜", draw: "让平", away: "让负" };
  const [handicap, option] = key.includes(":") ? key.split(":") : ["", key];
  return `${handicap}${labels[option] || option}`;
}

function formatMarketName(betType: string) {
  const names: Record<string, string> = {
    X1X: "胜平负",
    HANDICAP_X1X: "让球胜平负",
    CORRECT_SCORE: "猜比分",
    TOTAL_GOALS: "总进球",
    HALF_FULL: "半全场",
  };
  return names[betType] || betType;
}

function formatBetOption(betType: string, optionKey: string) {
  if (betType === "X1X") return ({ home: "胜", draw: "平", away: "负" } as Record<string, string>)[optionKey] || optionKey;
  if (betType === "HANDICAP_X1X") return formatHandicapLabel(optionKey);
  return optionKey;
}
