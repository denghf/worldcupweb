"use client";

import { useState, useEffect } from "react";

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
  tournamentName: string;
  odds: {
    x1x: Record<string, number>;
    handicapX1x: Record<string, number>;
    halfFull: { label: string; value: number }[];
    totalGoals: { label: string; value: number }[];
    correctScore: { label: string; value: number }[];
  };
}

type DateGroup = {
  key: string;
  label: string;
  weekday: string;
  matches: Match[];
};

const beijingDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

const beijingTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function getBeijingDateGroup(date: Date) {
  const parts = Object.fromEntries(
    beijingDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    key: `${parts.year}-${parts.month}-${parts.day}`,
    label: `${parts.month}/${parts.day}`,
    weekday: parts.weekday,
  };
}

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "未开赛",
  SEALED: "已封盘",
  LIVE: "进行中",
  FINISHED: "已结束",
};

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

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailMatchId, setDetailMatchId] = useState<number | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setMatches(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const groups = matches.reduce<DateGroup[]>((acc, match) => {
    const dateGroup = getBeijingDateGroup(new Date(match.kickoffTime));
    let group = acc.find((item) => item.key === dateGroup.key);
    if (!group) {
      group = {
        ...dateGroup,
        matches: [],
      };
      acc.push(group);
    }
    group.matches.push(match);
    return acc;
  }, []);

  const selectedDate = activeDate ?? groups[0]?.key;
  const selectedGroup = groups.find((group) => group.key === selectedDate) ?? groups[0];
  const upcomingCount = matches.filter((match) => match.status === "UPCOMING").length;
  const detailMatch = matches.find((match) => match.id === detailMatchId) ?? null;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-full bg-white px-4 py-2 text-sm text-text-muted shadow-sm">加载赛程中...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">⚽</div>
        <div className="mb-1 text-sm font-bold text-text-primary">暂无赛事</div>
        <div className="text-xs text-text-muted">等管理员添加赛事后就能看到了</div>
      </div>
    );
  }

  return (
    <div className="bg-pattern px-3 pb-4 pt-3">
      <section className="mb-3 overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-red-dim p-4 text-white shadow-[0_14px_34px_rgba(230,0,18,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-semibold opacity-80">2026 FIFA WORLD CUP</div>
            <h2 className="text-2xl font-black tracking-tight">小组赛竞猜</h2>
            <p className="mt-1 text-xs opacity-80">看赛程、看赔率，下注请找管理员录入</p>
          </div>
          <div className="rounded-2xl bg-white/18 px-3 py-2 text-right backdrop-blur">
            <div className="num text-2xl font-black">{upcomingCount}</div>
            <div className="text-[10px] opacity-80">可竞猜</div>
          </div>
        </div>
      </section>

      <div className="sticky top-12 z-30 -mx-3 mb-3 border-b border-border bg-bg-deep/95 px-3 py-2 backdrop-blur-xl">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto py-0.5">
          {groups.map((group) => (
            <button
              key={group.key}
              onClick={() => {
                setActiveDate(group.key);
                setDetailMatchId(null);
              }}
              className={`flex h-11 min-w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl px-3 text-center leading-none transition-all ${
                selectedGroup?.key === group.key
                  ? "bg-accent text-white shadow-[0_4px_12px_rgba(230,0,18,0.18)]"
                  : "bg-white text-text-secondary shadow-sm"
              }`}
            >
              <div className="num text-sm font-bold leading-none">{group.label}</div>
              <div className="mt-0.5 text-[10px] font-semibold leading-none opacity-80">{group.weekday}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedGroup && (
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-text-secondary">
              2026-{selectedGroup.label.replace("/", "-")} · {selectedGroup.weekday}
            </div>
            <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-text-muted shadow-sm">
              {selectedGroup.matches.length} 场比赛
            </div>
          </div>

          <div className="space-y-2.5">
            {selectedGroup.matches.map((match, index) => (
              <MatchCard
                key={match.id}
                match={match}
                index={index}
                onOpenDetail={() => setDetailMatchId(match.id)}
              />
            ))}
          </div>
        </div>
      )}

      {detailMatch && <MatchOddsDrawer match={detailMatch} onClose={() => setDetailMatchId(null)} />}
    </div>
  );
}

function MatchCard({
  match,
  index,
  onOpenDetail,
}: {
  match: Match;
  index: number;
  onOpenDetail: () => void;
}) {
  const timeStr = beijingTimeFormatter.format(new Date(match.kickoffTime));
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "LIVE";
  const isSealed = match.status === "SEALED" || isFinished;

  const x1x = match.odds?.x1x || {};

  return (
    <article className={`glass overflow-hidden rounded-2xl animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
      <button type="button" onClick={onOpenDetail} className="block w-full px-3.5 py-3 text-left transition-colors hover:bg-bg-surface/70">
        <div className="mb-3 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-text-muted">
            <span className="font-semibold">小组赛</span>
            <span>·</span>
            <span className="num font-bold text-text-secondary">{timeStr}</span>
            {isLive && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                isFinished
                  ? "bg-bg-elevated text-text-muted"
                  : isLive
                    ? "bg-accent/10 text-accent"
                    : isSealed
                      ? "bg-text-primary/5 text-text-secondary"
                      : "bg-red/10 text-accent"
              }`}
            >
              {STATUS_LABELS[match.status] ?? match.status}
            </span>
            <span className="rounded-full bg-bg-surface px-2 py-0.5 font-semibold text-text-muted">详情</span>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamBlock align="left" name={match.homeTeam} logo={match.homeTeamLogo} />
          <div className="min-w-13 text-center">
            {isFinished && match.homeScore !== null ? (
              <div className="rounded-xl bg-text-primary px-2 py-1 text-white">
                <span className="num text-lg font-black">{match.homeScore}</span>
                <span className="mx-1 text-xs opacity-60">-</span>
                <span className="num text-lg font-black">{match.awayScore}</span>
              </div>
            ) : (
              <div className="rounded-full border border-border bg-bg-surface px-3 py-1 text-[11px] font-black text-text-muted">VS</div>
            )}
          </div>
          <TeamBlock align="right" name={match.awayTeam} logo={match.awayTeamLogo} />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <OddsBox label="胜" value={x1x.home} />
          <OddsBox label="平" value={x1x.draw} />
          <OddsBox label="负" value={x1x.away} />
        </div>
      </button>
    </article>
  );
}

function MatchOddsDrawer({ match, onClose }: { match: Match; onClose: () => void }) {
  const [selectedOdds, setSelectedOdds] = useState<Set<string>>(() => new Set());
  const timeStr = beijingTimeFormatter.format(new Date(match.kickoffTime));
  const isFinished = match.status === "FINISHED";
  const x1x = match.odds?.x1x || {};
  const handicapX1x = match.odds?.handicapX1x || {};
  const halfFull = match.odds?.halfFull || [];
  const totalGoals = match.odds?.totalGoals || [];
  const correctScore = match.odds?.correctScore || [];
  const toggleOdd = (key: string) => {
    setSelectedOdds((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 modal-overlay animate-fade-in" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-md flex-col bg-bg-deep shadow-[-18px_0_40px_rgba(31,37,48,0.18)] animate-slide-in-right md:max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 border-b border-border bg-white/95 px-3.5 py-2.5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold text-accent">ODDS DETAIL</div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-base font-black text-text-primary">赔率详情</h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedOdds.size > 0 ? "bg-accent text-white" : "bg-bg-surface text-text-muted"}`}>已选 {selectedOdds.size}</span>
                <span className="rounded-full bg-bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                  {selectedOdds.size > 0 ? "红色为已选，可截图给管理员" : "点击赔率多选后截图"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {selectedOdds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedOdds(new Set())}
                  className="h-8 rounded-full border border-border bg-white px-2.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  清空
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg-surface text-text-secondary transition-colors hover:border-accent hover:text-accent"
                aria-label="关闭赔率详情"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
          <section className="mb-2 overflow-hidden rounded-[10px] bg-white p-3 shadow-[0_4px_18px_rgba(31,37,48,0.06)] ring-1 ring-border">
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-text-muted">
              <span>{match.tournamentName}</span>
              <span className="num text-text-secondary">{timeStr}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <TeamBlock align="left" name={match.homeTeam} logo={match.homeTeamLogo} compact />
              <div className="min-w-14 text-center">
                {isFinished && match.homeScore !== null ? (
                  <div className="rounded-lg bg-text-primary px-2 py-1 text-white">
                    <span className="num text-lg font-black">{match.homeScore}</span>
                    <span className="mx-1 text-xs opacity-60">-</span>
                    <span className="num text-lg font-black">{match.awayScore}</span>
                  </div>
                ) : (
                  <div className="rounded-full border border-border bg-bg-surface px-3 py-1 text-[11px] font-black text-text-muted">VS</div>
                )}
                <div className="mt-1 text-[10px] font-semibold text-accent">{STATUS_LABELS[match.status] ?? match.status}</div>
              </div>
              <TeamBlock align="right" name={match.awayTeam} logo={match.awayTeamLogo} compact />
            </div>
          </section>

          <div className="space-y-1.5">
            <MarketGrid title="胜平负" columns="grid-cols-3">
              <ExpandedOddsCell label="胜" value={x1x.home} dense selected={selectedOdds.has("X1X:home")} onToggle={() => toggleOdd("X1X:home")} />
              <ExpandedOddsCell label="平" value={x1x.draw} dense selected={selectedOdds.has("X1X:draw")} onToggle={() => toggleOdd("X1X:draw")} />
              <ExpandedOddsCell label="负" value={x1x.away} dense selected={selectedOdds.has("X1X:away")} onToggle={() => toggleOdd("X1X:away")} />
            </MarketGrid>

            {Object.keys(handicapX1x).length > 0 && (
              <MarketGrid title="让球胜平负" columns="grid-cols-3">
                {Object.entries(handicapX1x).map(([key, value]) => {
                  const selectionKey = `HANDICAP_X1X:${key}`;
                  return (
                    <ExpandedOddsCell key={key} label={formatHandicapLabel(key)} value={value} dense selected={selectedOdds.has(selectionKey)} onToggle={() => toggleOdd(selectionKey)} />
                  );
                })}
              </MarketGrid>
            )}

            {correctScore.length > 0 && (
              <MarketGrid title="比分" columns="grid-cols-7">
                {correctScore.map((score) => {
                  const selectionKey = `CORRECT_SCORE:${score.label}`;
                  return (
                    <ExpandedOddsCell key={score.label} label={score.label} value={score.value} dense selected={selectedOdds.has(selectionKey)} onToggle={() => toggleOdd(selectionKey)} />
                  );
                })}
              </MarketGrid>
            )}

            {totalGoals.length > 0 && (
              <MarketGrid title="总进球" columns="grid-cols-8">
                {totalGoals.map((goal) => {
                  const selectionKey = `TOTAL_GOALS:${goal.label}`;
                  return (
                    <ExpandedOddsCell key={goal.label} label={goal.label} value={goal.value} dense selected={selectedOdds.has(selectionKey)} onToggle={() => toggleOdd(selectionKey)} />
                  );
                })}
              </MarketGrid>
            )}

            {halfFull.length > 0 && (
              <MarketGrid title="半全场" columns="grid-cols-3">
                {halfFull.map((option) => {
                  const selectionKey = `HALF_FULL:${option.label}`;
                  return (
                    <ExpandedOddsCell key={option.label} label={option.label} value={option.value} dense selected={selectedOdds.has(selectionKey)} onToggle={() => toggleOdd(selectionKey)} />
                  );
                })}
              </MarketGrid>
            )}
          </div>
        </div>
      </aside>
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

function OddsBox({ label, value }: { label: string; value?: number }) {
  return (
    <div className="odds-btn flex items-center justify-center gap-1 px-1.5 py-2 text-center text-sm text-text-primary">
      <span>{label}</span>
      <span className="num">{value?.toFixed(2) ?? "-"}</span>
    </div>
  );
}

function ExpandedOddsCell({
  label,
  value,
  dense = false,
  selected = false,
  onToggle,
}: {
  label: string;
  value?: number;
  dense?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const content = (
    <>
      <span className={`text-[10px] font-semibold leading-none ${selected ? "text-white" : "text-text-primary"}`}>{label}</span>
      <span className={`num mt-0.5 text-[10px] leading-none ${selected ? "text-white/90" : "text-text-secondary"}`}>{value?.toFixed(2) ?? "-"}</span>
    </>
  );
  const className = `expanded-odds-cell relative flex flex-col items-center justify-center border-r border-b px-0.5 text-center first:rounded-tl-[5px] ${dense ? "h-8 py-0.5" : "min-h-10 py-1"} ${selected ? "selected border-accent" : "border-border/70"}`;

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
