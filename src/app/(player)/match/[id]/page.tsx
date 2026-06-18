"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { displayTeamName } from "@/lib/team-display";
import {
  HANDICAP_LABELS,
  MARKET_NAMES,
  X1X_LABELS,
  formatOptionLabel,
  type BetMarket,
} from "@/lib/bet-display";

interface Match {
  id: number;
  matchNo?: string | null;
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

type ParlayItem = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  betMarket: BetMarket;
  selectedOption: string;
  odds: number;
};

type OddsOption = {
  market: BetMarket;
  optionKey: string;
  label: string;
  odds: number;
};

const beijingTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const beijingDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
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
  沙特阿拉伯: "🇸🇦",
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
  民主刚果: "🇨🇩",
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

  const [matches, setMatches] = useState<Match[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [bettableNow, setBettableNow] = useState<number | null>(null);
  const [selectedOdds, setSelectedOdds] = useState<Set<string>>(() => new Set());
  const [loggedIn, setLoggedIn] = useState(false);
  const [betAmounts, setBetAmounts] = useState<Record<string, string>>({});
  const [betSubmitting, setBetSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "parlay">("single");
  const [parlayItems, setParlayItems] = useState<ParlayItem[]>([]);
  const [parlayAmount, setParlayAmount] = useState(DEFAULT_BET_AMOUNT);
  const [activeMoreMatchId, setActiveMoreMatchId] = useState<number | null>(null);
  const [parlaySubmitting, setParlaySubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const rows = (res.data || []) as Match[];
          setBettableNow(Date.now());
          setMatches(rows);
          setMatch(rows.find((m) => m.id === matchId) || null);
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

  const currentMatchDateKey = getBeijingDateKey(match?.kickoffTime);
  const bettableMatches = useMemo(() => {
    const now = bettableNow ?? 0;
    return matches
      .filter((m) => (
        m.status === "UPCOMING" &&
        new Date(m.kickoffTime).getTime() > now &&
        getBeijingDateKey(m.kickoffTime) === currentMatchDateKey
      ))
      .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime());
  }, [matches, bettableNow, currentMatchDateKey]);

  const activeMoreMatch = activeMoreMatchId ? bettableMatches.find((m) => m.id === activeMoreMatchId) || null : null;
  const parlayTotalOdds = parlayItems.length > 0 ? parlayItems.reduce((acc, item) => acc * item.odds, 1) : 0;
  const parlayRoundedOdds = Math.round(parlayTotalOdds * 100) / 100;
  const parlayStake = Number(parlayAmount);
  const parlayPayout = Number.isFinite(parlayStake) && parlayStake > 0 && parlayItems.length > 0
    ? Math.round(parlayStake * parlayRoundedOdds * 100) / 100
    : 0;

  const toggleParlayItem = (item: ParlayItem) => {
    setParlayItems((current) => {
      const existing = current.find((p) => p.matchId === item.matchId);
      if (existing && existing.betMarket === item.betMarket && existing.selectedOption === item.selectedOption) {
        return current.filter((p) => p.matchId !== item.matchId);
      }
      return [...current.filter((p) => p.matchId !== item.matchId), item];
    });
  };

  const stepParlayAmount = (direction: -1 | 1) => {
    setParlayAmount((current) => {
      const amount = Number(current || DEFAULT_BET_AMOUNT);
      const next = Math.max(BET_AMOUNT_STEP, (Number.isFinite(amount) ? amount : BET_AMOUNT_STEP) + direction * BET_AMOUNT_STEP);
      return String(next);
    });
  };

  const submitParlayBet = async () => {
    const token = localStorage.getItem("player_token");
    if (!loggedIn || !token) return router.push("/profile/login");
    if (parlayItems.length < 2) return alert("串关至少选择 2 场比赛");
    if (!Number.isFinite(parlayStake) || parlayStake <= 0) return alert("请输入有效投注金额");
    if (!confirm(`确认串关 ${parlayItems.length} 场，共 ${parlayStake.toFixed(1)} 记分？预计赔付 ${parlayPayout.toFixed(1)}`)) return;

    setParlaySubmitting(true);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          betMode: "PARLAY",
          items: parlayItems.map((item) => ({
            matchId: item.matchId,
            betMarket: item.betMarket,
            selectedOption: item.selectedOption,
          })),
          totalAmount: parlayStake,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("串关投注成功！");
        setParlayItems([]);
        router.push("/profile");
      } else {
        alert(data.error || "串关投注失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setParlaySubmitting(false);
    }
  };

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

  if (viewMode === "parlay") {
    const dateLabel = formatBeijingDateLabel(bettableMatches[0]?.kickoffTime || match.kickoffTime);

    return (
      <div className="bg-pattern min-h-[100dvh] px-3 pb-28 pt-3">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("single")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold text-accent">PARLAY BET</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-base font-black text-text-primary">串关下注</h1>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${parlayItems.length > 0 ? "bg-accent text-white" : "bg-bg-surface text-text-muted"}`}>
                已选 {parlayItems.length}
              </span>
            </div>
          </div>
          {parlayItems.length > 0 && (
            <button
              type="button"
              onClick={() => setParlayItems([])}
              className="h-8 rounded-full border border-border bg-white px-2.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              清空
            </button>
          )}
        </div>

        <section className="mb-3 rounded-[10px] bg-white p-3 shadow-[0_4px_18px_rgba(31,37,48,0.06)] ring-1 ring-border">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold text-accent">{dateLabel}</div>
              <div className="mt-0.5 text-sm font-black text-text-primary">可串关比赛</div>
            </div>
            <div className="rounded-full bg-bg-surface px-3 py-1 text-[11px] font-bold text-text-secondary">
              {bettableMatches.length} 场比赛
            </div>
          </div>
          <div className="mt-2 text-[11px] leading-relaxed text-text-muted">默认展示胜平负和让球胜平负，点击其它查看该场全部赔率。</div>
        </section>

        {bettableMatches.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center text-sm font-semibold text-text-muted shadow-sm ring-1 ring-border">
            暂无可串关比赛
          </div>
        ) : (
          <div className="space-y-2.5">
            {bettableMatches.map((item) => (
              <ParlayMatchCard
                key={item.id}
                match={item}
                selectedItem={parlayItems.find((p) => p.matchId === item.id)}
                onToggle={toggleParlayItem}
                onMore={() => setActiveMoreMatchId(item.id)}
              />
            ))}
          </div>
        )}

        <ParlayBottomBar
          amount={parlayAmount}
          itemCount={parlayItems.length}
          totalOdds={parlayRoundedOdds}
          payout={parlayPayout}
          submitting={parlaySubmitting}
          onAmountChange={setParlayAmount}
          onStepAmount={stepParlayAmount}
          onClear={() => setParlayItems([])}
          onSubmit={submitParlayBet}
        />

        {activeMoreMatch && (
          <ParlayOddsSheet
            match={activeMoreMatch}
            selectedItem={parlayItems.find((p) => p.matchId === activeMoreMatch.id)}
            onClose={() => setActiveMoreMatchId(null)}
            onSelect={(item) => {
              toggleParlayItem(item);
              setActiveMoreMatchId(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-pattern px-3 pb-4 pt-3">
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
        <div className="min-w-0 flex-1">
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
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {bettableMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setViewMode("parlay")}
              className="h-8 rounded-full bg-accent px-3 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(230,0,18,0.18)] transition-transform active:scale-[0.98]"
            >
              串关
            </button>
          )}
          {canSelect && selectedOdds.size > 0 && (
            <button
              type="button"
              onClick={() => { setSelectedOdds(new Set()); setBetAmounts({}); }}
              className="h-8 rounded-full border border-border bg-white px-2.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              清空
            </button>
          )}
        </div>
      </div>

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
  const displayName = displayTeamName(name);
  const mark = logo || TEAM_MARKS[displayName] || TEAM_MARKS[name] || "🏳️";

  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end text-right" : ""}`}>
      {align === "left" && <span className={`flag-badge shrink-0 ${compact ? "h-8 w-8 text-lg" : "text-xl"}`}>{mark}</span>}
      <div className="min-w-0">
        <div className={`${compact ? "text-xs" : "text-sm"} truncate font-extrabold text-text-primary`}>{displayName}</div>
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

function MarketGrid({ title, columns, children }: { title: string; columns: string; children: ReactNode }) {
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

function ParlayMatchCard({
  match,
  selectedItem,
  onToggle,
  onMore,
}: {
  match: Match;
  selectedItem?: ParlayItem;
  onToggle: (item: ParlayItem) => void;
  onMore: () => void;
}) {
  const time = beijingTimeFormatter.format(new Date(match.kickoffTime));
  const x1xOptions = getX1xOptions(match);
  const handicapOptions = getHandicapOptions(match);

  return (
    <section className="overflow-hidden rounded-[10px] bg-white shadow-[0_4px_18px_rgba(31,37,48,0.06)] ring-1 ring-border">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-2.5 py-2">
        <div className="min-w-0">
          <div className="text-[10px] font-black text-text-primary">{match.matchNo || `#${match.id}`}</div>
          <div className="truncate text-[10px] font-semibold text-text-muted">{match.tournamentName}</div>
        </div>
        <button
          type="button"
          onClick={onMore}
          className="rounded-full border border-border bg-bg-surface px-3 py-1 text-[11px] font-black text-accent transition-colors hover:border-accent hover:bg-accent hover:text-white"
        >
          其它
        </button>
      </div>
      <div className="p-2.5">
        <div className="grid grid-cols-[1fr_58px_1fr] items-center gap-2">
          <MiniTeam align="left" name={match.homeTeam} logo={match.homeTeamLogo} />
          <div className="text-center">
            <div className="rounded-full border border-border bg-bg-surface px-2 py-1 text-[10px] font-black text-text-secondary">{time}</div>
            <div className="mt-0.5 text-[9px] font-semibold text-text-muted">VS</div>
          </div>
          <MiniTeam align="right" name={match.awayTeam} logo={match.awayTeamLogo} />
        </div>

        <div className="mt-2 space-y-1.5">
          {x1xOptions.length > 0 && (
            <ParlayMarketRow
              title="胜平负"
              options={x1xOptions}
              match={match}
              selectedItem={selectedItem}
              onToggle={onToggle}
            />
          )}
          {handicapOptions.length > 0 && (
            <ParlayMarketRow
              title="让球胜平负"
              options={handicapOptions}
              match={match}
              selectedItem={selectedItem}
              onToggle={onToggle}
            />
          )}
        </div>

        {selectedItem && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-accent/8 px-2.5 py-1.5 text-[11px]">
            <span className="min-w-0 truncate font-bold text-text-primary">
              已选 {MARKET_NAMES[selectedItem.betMarket]} · {formatOptionLabel(selectedItem.betMarket, selectedItem.selectedOption)}
            </span>
            <span className="num shrink-0 font-black text-accent">@{selectedItem.odds.toFixed(2)}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function MiniTeam({ align, name, logo }: { align: "left" | "right"; name: string; logo: string | null }) {
  const displayName = displayTeamName(name);
  const mark = logo || TEAM_MARKS[displayName] || TEAM_MARKS[name] || "🏳️";

  return (
    <div className={`flex min-w-0 items-center gap-1.5 ${align === "right" ? "justify-end text-right" : ""}`}>
      {align === "left" && <span className="flag-badge h-7 w-7 shrink-0 text-base">{mark}</span>}
      <span className="truncate text-xs font-black text-text-primary">{displayName}</span>
      {align === "right" && <span className="flag-badge h-7 w-7 shrink-0 text-base">{mark}</span>}
    </div>
  );
}

function ParlayMarketRow({
  title,
  options,
  match,
  selectedItem,
  onToggle,
}: {
  title: string;
  options: OddsOption[];
  match: Match;
  selectedItem?: ParlayItem;
  onToggle: (item: ParlayItem) => void;
}) {
  return (
    <div className="grid grid-cols-[68px_1fr] overflow-hidden rounded-[6px] bg-white ring-1 ring-border/70">
      <div className="flex items-center justify-center border-r border-border/70 bg-bg-surface px-1 text-center text-[10px] font-black text-text-secondary">
        {title}
      </div>
      <div className="grid grid-cols-3 -mr-px -mb-px">
        {options.map((option) => (
          <ParlayOddsButton
            key={`${option.market}:${option.optionKey}`}
            option={option}
            selected={selectedItem?.betMarket === option.market && selectedItem.selectedOption === option.optionKey}
            onClick={() => onToggle(toParlayItem(match, option))}
          />
        ))}
      </div>
    </div>
  );
}

function ParlayOddsButton({ option, selected, onClick }: { option: OddsOption; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`expanded-odds-cell flex min-h-9 flex-col items-center justify-center border-r border-b px-1 py-1 text-center transition-all active:scale-[0.98] ${selected ? "selected border-accent" : "border-border/70"}`}
      aria-pressed={selected}
    >
      <span className={`truncate text-[10px] font-semibold leading-none ${selected ? "text-white" : "text-text-primary"}`}>{option.label}</span>
      <span className={`num mt-0.5 text-[10px] leading-none ${selected ? "text-white/90" : "text-text-secondary"}`}>{option.odds.toFixed(2)}</span>
    </button>
  );
}

function ParlayBottomBar({
  amount,
  itemCount,
  totalOdds,
  payout,
  submitting,
  onAmountChange,
  onStepAmount,
  onClear,
  onSubmit,
}: {
  amount: string;
  itemCount: number;
  totalOdds: number;
  payout: number;
  submitting: boolean;
  onAmountChange: (value: string) => void;
  onStepAmount: (direction: -1 | 1) => void;
  onClear: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 pointer-events-none">
      <div className="mx-auto max-w-md md:max-w-3xl pointer-events-auto rounded-2xl bg-white p-3 shadow-[0_-12px_32px_rgba(31,37,48,0.16)] ring-1 ring-border">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={itemCount === 0}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-bold text-text-secondary disabled:opacity-40"
          >
            清空
          </button>
          <div className="min-w-0 text-right text-[11px] font-bold text-text-muted">
            <span className="text-text-primary">{itemCount} 场</span>
            <span className="mx-1">·</span>
            <span className="num text-accent">@{totalOdds > 0 ? totalOdds.toFixed(2) : "0.00"}</span>
            <span className="mx-1">·</span>
            <span>预计 </span>
            <span className="num text-accent">{payout.toFixed(1)}</span>
          </div>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <div className="flex items-center rounded-xl border border-border bg-bg-surface">
            <button
              type="button"
              onClick={() => onStepAmount(-1)}
              className="flex h-10 w-9 items-center justify-center rounded-l-xl text-base font-black text-text-secondary transition-colors hover:bg-accent hover:text-white"
              aria-label="减少金额"
            >
              -
            </button>
            <input
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              inputMode="decimal"
              className="num h-10 w-14 border-x border-border bg-white text-center text-sm font-black text-text-primary outline-none"
            />
            <button
              type="button"
              onClick={() => onStepAmount(1)}
              className="flex h-10 w-9 items-center justify-center rounded-r-xl text-base font-black text-text-secondary transition-colors hover:bg-accent hover:text-white"
              aria-label="增加金额"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="btn-primary rounded-xl text-sm disabled:opacity-40"
          >
            {submitting ? "提交中..." : "确认串关"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ParlayOddsSheet({
  match,
  selectedItem,
  onClose,
  onSelect,
}: {
  match: Match;
  selectedItem?: ParlayItem;
  onClose: () => void;
  onSelect: (item: ParlayItem) => void;
}) {
  const sections = getAllMarketSections(match);

  return (
    <>
      <button
        type="button"
        aria-label="关闭全部赔率"
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <section className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[82dvh] max-w-md overflow-hidden rounded-t-[22px] bg-white shadow-2xl md:max-w-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-text-primary">
              {displayTeamName(match.homeTeam)} vs {displayTeamName(match.awayTeam)}
            </h2>
            <div className="mt-0.5 text-[11px] font-semibold text-text-muted">
              {match.matchNo || `#${match.id}`} · {match.tournamentName} · {beijingTimeFormatter.format(new Date(match.kickoffTime))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-surface text-sm font-black text-text-secondary"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(82dvh-70px)] overflow-y-auto px-3 py-3">
          <div className="space-y-2.5">
            {sections.map((section) => (
              <section key={section.market} className="overflow-hidden rounded-[8px] bg-white ring-1 ring-border/70">
                <div className="flex h-8 items-center justify-between border-b border-border/70 bg-bg-surface px-2.5">
                  <h3 className="text-[11px] font-black text-text-primary">{section.title}</h3>
                  <span className="text-[10px] font-semibold text-text-muted">{section.options.length} 项</span>
                </div>
                <div className={`grid ${section.columns} -mr-px -mb-px`}>
                  {section.options.map((option) => {
                    const selected = selectedItem?.betMarket === option.market && selectedItem.selectedOption === option.optionKey;
                    return (
                      <ParlayOddsButton
                        key={`${option.market}:${option.optionKey}`}
                        option={option}
                        selected={selected}
                        onClick={() => onSelect(toParlayItem(match, option))}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function formatHandicapLabel(key: string) {
  const [handicap, option] = key.includes(":") ? key.split(":") : ["", key];
  return `${handicap}${HANDICAP_LABELS[option] || option}`;
}

function formatMarketName(betType: string) {
  return MARKET_NAMES[betType] || betType;
}

function formatBetOption(betType: string, optionKey: string) {
  return formatOptionLabel(betType, optionKey);
}

function getX1xOptions(match: Match): OddsOption[] {
  return (["home", "draw", "away"] as const).reduce<OddsOption[]>((options, key) => {
    const odds = match.odds?.x1x?.[key];
    if (odds) options.push({ market: "X1X", optionKey: key, label: X1X_LABELS[key], odds });
    return options;
  }, []);
}

function getHandicapOptions(match: Match): OddsOption[] {
  return Object.entries(match.odds?.handicapX1x || {}).map(([optionKey, odds]) => ({
    market: "HANDICAP_X1X" as const,
    optionKey,
    label: formatHandicapLabel(optionKey),
    odds,
  }));
}

function getAllMarketSections(match: Match) {
  const sections = [
    {
      market: "X1X" as const,
      title: MARKET_NAMES.X1X,
      columns: "grid-cols-3",
      options: getX1xOptions(match),
    },
    {
      market: "HANDICAP_X1X" as const,
      title: MARKET_NAMES.HANDICAP_X1X,
      columns: "grid-cols-3",
      options: getHandicapOptions(match),
    },
    {
      market: "CORRECT_SCORE" as const,
      title: MARKET_NAMES.CORRECT_SCORE,
      columns: "grid-cols-4 md:grid-cols-6",
      options: (match.odds?.correctScore || []).map((option) => ({
        market: "CORRECT_SCORE" as const,
        optionKey: option.label,
        label: option.label,
        odds: option.value,
      })),
    },
    {
      market: "TOTAL_GOALS" as const,
      title: MARKET_NAMES.TOTAL_GOALS,
      columns: "grid-cols-4 md:grid-cols-8",
      options: (match.odds?.totalGoals || []).map((option) => ({
        market: "TOTAL_GOALS" as const,
        optionKey: option.label,
        label: option.label,
        odds: option.value,
      })),
    },
    {
      market: "HALF_FULL" as const,
      title: MARKET_NAMES.HALF_FULL,
      columns: "grid-cols-3",
      options: (match.odds?.halfFull || []).map((option) => ({
        market: "HALF_FULL" as const,
        optionKey: option.label,
        label: option.label,
        odds: option.value,
      })),
    },
  ];

  return sections.filter((section) => section.options.length > 0);
}

function toParlayItem(match: Match, option: OddsOption): ParlayItem {
  return {
    matchId: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    betMarket: option.market,
    selectedOption: option.optionKey,
    odds: option.odds,
  };
}

function getBeijingDateKey(value?: string | null) {
  if (!value) return "";
  const parts = beijingDateFormatter.formatToParts(new Date(value));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>;
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function formatBeijingDateLabel(value: string) {
  const parts = beijingDateFormatter.formatToParts(new Date(value));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>;
  return `${byType.year}-${byType.month}-${byType.day} ${byType.weekday}`;
}
