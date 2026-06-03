"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const WORLD_CUP_KICKOFF = new Date("2026-06-11T00:00:00-04:00").getTime();

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, WORLD_CUP_KICKOFF - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

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

export default function HomePage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

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

  const defaultDate = groups.find((g) => g.matches.some((m) => m.status !== "FINISHED"))?.key ?? groups[0]?.key;
  const selectedDate = activeDate ?? defaultDate;
  const selectedGroup = groups.find((group) => group.key === selectedDate) ?? groups[0];

  useEffect(() => {
    if (!tabListRef.current || !selectedDate) return;
    const activeBtn = tabListRef.current.querySelector(`[data-tab-key="${selectedDate}"]`) as HTMLElement | null;
    if (!activeBtn) return;
    const container = tabListRef.current;
    const newScrollLeft = activeBtn.offsetLeft - 12;
    container.scrollTo({ left: Math.max(0, newScrollLeft), behavior: "smooth" });
  }, [selectedDate]);

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
    <div className="bg-pattern px-3 pb-4">
      <section className="-mx-3 bg-gradient-to-r from-accent to-red-dim text-white" style={{ aspectRatio: "1120/400" }}>
        <img
          src="/banner.png"
          alt="2026世界杯"
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </section>

      <CountdownSection />

      <div className="sticky top-0 z-30 -mx-3 mb-3 border-b border-border bg-bg-deep/95 px-3 py-2 backdrop-blur-xl">
        <div ref={tabListRef} className="scrollbar-hide flex gap-2 overflow-x-auto py-0.5">
          {groups.map((group) => (
            <button
              key={group.key}
              data-tab-key={group.key}
              onClick={() => {
                setActiveDate(group.key);
              }}
              className={`flex h-11 min-w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl px-3 text-center leading-none transition-all ${
                selectedGroup?.key === group.key
                  ? "bg-accent text-white"
                  : "bg-white text-text-secondary"
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
                onOpenDetail={() => router.push(`/match/${match.id}`)}
              />
            ))}
          </div>
        </div>
      )}

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
  const { label: statusLabel, isFinished, isLive, isSealed } = getMatchDisplayStatus(match);

  const x1x = match.odds?.x1x || {};

  return (
    <article className={`glass overflow-hidden rounded-2xl animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
      <button type="button" onClick={onOpenDetail} className="block w-full px-3.5 py-3 text-left transition-colors hover:bg-bg-surface/70 focus:outline-none">
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
                      : "bg-[rgba(22,119,255,0.12)] text-[#1677ff]"
              }`}
            >
              {statusLabel}
            </span>
            <span className="rounded-full bg-bg-surface px-2 py-0.5 font-semibold text-text-muted">详情</span>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamBlock align="left" name={match.homeTeam} logo={match.homeTeamLogo} />
          <div className="min-w-13 text-center">
            {isFinished && match.homeScore !== null ? (
              <div className="px-3 py-1.5">
                <span className="num text-2xl font-black text-text-primary">{match.finalHomeScore ?? match.homeScore}</span>
                <span className="mx-1.5 text-lg font-bold text-text-muted">:</span>
                <span className="num text-2xl font-black text-text-primary">{match.finalAwayScore ?? match.awayScore}</span>
              </div>
            ) : (
              <div className="rounded-full border border-border bg-bg-surface px-3 py-1 text-[11px] font-black text-text-muted">VS</div>
            )}
          </div>
          <TeamBlock align="right" name={match.awayTeam} logo={match.awayTeamLogo} />
        </div>

        {isFinished && match.homeScore !== null ? (
          <div className="flex items-center justify-between rounded-xl bg-bg-surface px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-text-muted">半场</span>
              <span className="num font-bold text-text-primary">
                {match.halfHomeScore ?? "-"}:{match.halfAwayScore ?? "-"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-text-muted">全场</span>
              <span className="num font-bold text-text-primary">
                {match.homeScore}:{match.awayScore}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            <OddsBox label="胜" value={x1x.home} />
            <OddsBox label="平" value={x1x.draw} />
            <OddsBox label="负" value={x1x.away} />
          </div>
        )}
      </button>
    </article>
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

function CountdownSection() {
  const { days, hours, minutes, seconds } = useCountdown();

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="-mx-3 bg-accent px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-white">世界杯倒计时</div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            <span className="num flex h-6 w-5.5 items-center justify-center rounded bg-white text-sm font-black text-accent">{pad(days)[0]}</span>
            <span className="num flex h-6 w-5.5 items-center justify-center rounded bg-white text-sm font-black text-accent">{pad(days)[1]}</span>
          </div>
          <span className="mx-0.5 text-[10px] font-bold text-white/80">天</span>
          <div className="flex items-center gap-0.5">
            <span className="num flex h-6 w-5.5 items-center justify-center rounded bg-white text-sm font-black text-accent">{pad(hours)[0]}</span>
            <span className="num flex h-6 w-5.5 items-center justify-center rounded bg-white text-sm font-black text-accent">{pad(hours)[1]}</span>
          </div>
          <span className="mx-0.5 text-xs font-black text-white">:</span>
          <div className="flex items-center gap-0.5">
            <span className="num flex h-6 w-5.5 items-center justify-center rounded bg-white text-sm font-black text-accent">{pad(minutes)[0]}</span>
            <span className="num flex h-6 w-5.5 items-center justify-center rounded bg-white text-sm font-black text-accent">{pad(minutes)[1]}</span>
          </div>
          <span className="mx-0.5 text-xs font-black text-white">:</span>
          <div className="flex items-center gap-0.5">
            <span className="num flex h-6 w-5.5 items-center justify-center rounded bg-white text-sm font-black text-accent">{pad(seconds)[0]}</span>
            <span className="num flex h-6 w-5.5 items-center justify-center rounded bg-white text-sm font-black text-accent">{pad(seconds)[1]}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

