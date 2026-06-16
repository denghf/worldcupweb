"use client";

import { useState, useEffect } from "react";

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("netProfit");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl px-4 py-4 animate-pulse">
              <div className="h-3 w-16 bg-bg-elevated rounded mb-2" />
              <div className="h-6 w-20 bg-bg-elevated rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <div className="text-text-muted text-sm">加载失败</div>;

  return (
    <div className="w-full space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="总下注额" value={`${stats.totalBetAmount.toFixed(1)}`} />
        <StatCard label="总赔付" value={`${stats.totalPayout.toFixed(1)}`} color="accent" />
        <StatCard
          label="平台盈利"
          value={`${stats.netProfit.toFixed(1)}`}
          color={stats.netProfit >= 0 ? "accent" : "red"}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="已下注" value={String(stats.activeBetsCount)} />
        <StatCard label="已中奖" value={String(stats.wonBetsCount)} color="accent" />
        <StatCard label="未中奖" value={String(stats.lostBetsCount)} />
      </div>

      {/* User ranking */}
      <div>
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            <h2 className="font-display text-base font-semibold">用户排名</h2>
            <p className="text-text-muted text-sm mt-0.5">点击表头可按对应指标排序</p>
          </div>
          <div className="text-xs text-text-muted">共 {stats.topUsers.length} 人</div>
        </div>
        {stats.topUsers.length === 0 ? (
          <div className="text-text-muted text-sm py-4">暂无数据</div>
        ) : (
          <div className="glass rounded-xl overflow-x-auto">
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
        )}
      </div>
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
