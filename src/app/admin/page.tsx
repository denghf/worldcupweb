"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminMobileTopBar } from "@/components/admin/mobile-nav";
import { PlayerProfitCharts, type ProfitChartsData } from "@/components/admin/PlayerProfitCharts";

type RankingUser = {
  nickname: string;
  totalBetAmount: number;
  totalWinAmount: number;
  totalBets: number;
  totalWonBets: number;
  netProfit: number;
  winRate: number;
  returnRate: number;
};

interface Stats {
  totalBets: number;
  totalBetAmount: number;
  totalPayout: number;
  netProfit: number;
  totalUsers: number;
  pendingReviewCount: number;
  activeBetsCount: number;
  wonBetsCount: number;
  lostBetsCount: number;
  topUsers: RankingUser[];
  profitCharts: ProfitChartsData;
}

type SortKey = "rank" | keyof RankingUser;
type SortDirection = "asc" | "desc";

const RANKING_COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "rank", label: "排名", align: "left" },
  { key: "nickname", label: "昵称", align: "left" },
  { key: "totalBetAmount", label: "投注额", align: "right" },
  { key: "totalWinAmount", label: "中奖额", align: "right" },
  { key: "totalBets", label: "总购买场次", align: "right" },
  { key: "totalWonBets", label: "中奖场次", align: "right" },
  { key: "netProfit", label: "投注盈亏", align: "right" },
  { key: "winRate", label: "中奖率", align: "right" },
  { key: "returnRate", label: "回报率", align: "right" },
];

const MOBILE_SORT_KEYS: SortKey[] = [
  "netProfit",
  "totalBetAmount",
  "totalWinAmount",
  "winRate",
  "returnRate",
  "totalBets",
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("netProfit");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/stats");
      const res = await r.json();
      if (res.success) setStats(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sortedUsers = stats ? getSortedUsers(stats.topUsers, sortKey, sortDirection) : [];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "nickname" ? "asc" : "desc");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <AdminMobileTopBar title="总览" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 md:mt-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass rounded-xl px-4 py-4 animate-pulse">
              <div className="h-3 w-16 bg-bg-elevated rounded mb-2" />
              <div className="h-6 w-20 bg-bg-elevated rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full">
        <AdminMobileTopBar title="总览" />
        <div className="text-text-muted text-sm mt-3 md:mt-0">加载失败</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <AdminMobileTopBar
        title="总览"
        right={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="刷新"
            className="p-2 -my-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={refreshing ? "animate-spin" : ""}
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="总下注额" value={`${stats.totalBetAmount.toFixed(1)}`} />
        <StatCard label="总赔付" value={`${stats.totalPayout.toFixed(1)}`} color="accent" />
        <StatCard
          label="平台盈利"
          value={`${stats.netProfit.toFixed(1)}`}
          color={stats.netProfit >= 0 ? "accent" : "red"}
        />
        <StatCard label="已下注" value={String(stats.activeBetsCount)} />
        <StatCard label="已中奖" value={String(stats.wonBetsCount)} color="accent" />
        <StatCard label="未中奖" value={String(stats.lostBetsCount)} />
      </div>

      {/* User ranking */}
      <div>
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            <h2 className="font-display text-base font-semibold">用户排名</h2>
            <p className="text-text-muted text-sm mt-0.5 hidden md:block">点击表头可按对应指标排序</p>
          </div>
          <div className="text-xs text-text-muted">共 {stats.topUsers.length} 人</div>
        </div>
        {stats.topUsers.length === 0 ? (
          <div className="text-text-muted text-sm py-4">暂无数据</div>
        ) : (
          <>
            {/* Mobile sort chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide md:hidden -mx-1 px-1 mb-3 pb-1">
              {MOBILE_SORT_KEYS.map((key) => {
                const active = sortKey === key;
                const col = RANKING_COLUMNS.find((c) => c.key === key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSort(key)}
                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors flex items-center gap-1 ${
                      active
                        ? "bg-accent/10 text-accent font-semibold"
                        : "bg-bg-elevated text-text-secondary"
                    }`}
                  >
                    {col?.label}
                    <span className="text-[10px]">{active ? (sortDirection === "desc" ? "↓" : "↑") : ""}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block glass rounded-xl overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted text-sm">
                    {RANKING_COLUMNS.map((column) => (
                      <th key={column.key} className={`py-2.5 px-4 font-medium ${column.align === "right" ? "text-right" : "text-left"}`}>
                        <button
                          type="button"
                          onClick={() => handleSort(column.key)}
                          className={`inline-flex items-center gap-1 hover:text-text-primary transition-colors ${column.align === "right" ? "justify-end" : "justify-start"}`}
                        >
                          {column.label}
                          <span className={`text-[10px] ${sortKey === column.key ? "text-accent" : "text-text-muted/60"}`}>
                            {sortKey === column.key ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user, i) => (
                    <tr key={user.nickname} className="border-b border-border/50 last:border-0 hover:bg-bg-hover/50 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className={i < 3 ? "text-gold font-semibold" : "text-text-muted"}>{i + 1}</span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-text-primary">{user.nickname}</td>
                      <td className="py-2.5 px-4 text-right text-sm">{formatNumber(user.totalBetAmount)}</td>
                      <td className={`py-2.5 px-4 text-right text-sm ${user.totalWinAmount >= 0 ? "text-red" : "text-emerald-500"}`}>{formatNumber(user.totalWinAmount)}</td>
                      <td className="py-2.5 px-4 text-right text-sm">{user.totalBets}</td>
                      <td className="py-2.5 px-4 text-right text-sm">{user.totalWonBets}</td>
                      <td className={`py-2.5 px-4 text-right text-sm font-medium ${user.netProfit >= 0 ? "text-red" : "text-emerald-500"}`}>
                        {user.netProfit >= 0 ? "+" : ""}{formatNumber(user.netProfit)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-sm">{formatPercent(user.winRate)}</td>
                      <td className={`py-2.5 px-4 text-right text-sm ${user.returnRate >= 100 ? "text-accent" : "text-text-secondary"}`}>
                        {formatPercent(user.returnRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {sortedUsers.map((user, i) => (
                <RankingCard key={user.nickname} user={user} rank={i + 1} />
              ))}
            </div>
          </>
        )}
      </div>

      <PlayerProfitCharts data={stats.profitCharts} />
    </div>
  );
}

function RankingCard({ user, rank }: { user: RankingUser; rank: number }) {
  const profitPositive = user.netProfit >= 0;
  return (
    <div className="glass rounded-xl p-3.5 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <RankBadge rank={rank} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-text-primary truncate">{user.nickname}</div>
            <div className={`font-display text-lg font-bold ${profitPositive ? "text-red" : "text-emerald-500"}`}>
              {profitPositive ? "+" : ""}{formatNumber(user.netProfit)}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
            <span>{user.totalBets} 场</span>
            <span className="text-border-accent/40">·</span>
            <span>中奖率 {formatPercent(user.winRate)}</span>
            <span className="text-border-accent/40">·</span>
            <span>投注 {formatNumber(user.totalBetAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-white bg-gradient-to-br from-gold to-gold-dim shadow-md">
        {rank}
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-white bg-gradient-to-br from-text-secondary to-text-primary/80 shadow-md">
        {rank}
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-white bg-gradient-to-br from-[#c8702a] to-[#9a4f1a] shadow-md">
        {rank}
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-semibold text-text-secondary bg-bg-elevated">
      {rank}
    </div>
  );
}

function getSortedUsers(users: RankingUser[], sortKey: SortKey, sortDirection: SortDirection) {
  const effectiveSortKey: keyof RankingUser = sortKey === "rank" ? "netProfit" : sortKey;
  const multiplier = sortDirection === "desc" ? -1 : 1;
  return [...users].sort((a, b) => {
    const left = a[effectiveSortKey];
    const right = b[effectiveSortKey];
    if (typeof left === "string" && typeof right === "string") return left.localeCompare(right, "zh-CN") * multiplier;
    return ((left as number) - (right as number)) * multiplier;
  });
}

function formatNumber(value: number) {
  return value.toFixed(1);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function StatCard({
  label,
  value,
  color,
  pulse,
}: {
  label: string;
  value: string;
  color?: "accent" | "gold" | "red";
  pulse?: boolean;
}) {
  return (
    <div className="glass rounded-xl px-4 py-4 relative overflow-hidden">
      {pulse && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold animate-pulse" />
      )}
      <div className="text-text-muted text-sm mb-1">{label}</div>
      <div
        className={`text-xl font-bold ${
          color === "accent" ? "text-accent" : color === "gold" ? "text-gold" : color === "red" ? "text-red" : "text-text-primary"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
