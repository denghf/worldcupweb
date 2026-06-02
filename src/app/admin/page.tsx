"use client";

import { useState, useEffect } from "react";

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
  topUsers: { nickname: string; netProfit: number; totalBets: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl space-y-6">
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
    <div className="max-w-5xl space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="总下注额" value={`¥${Math.round(stats.totalBetAmount).toLocaleString()}`} />
        <StatCard label="总赔付" value={`¥${Math.round(stats.totalPayout).toLocaleString()}`} color="accent" />
        <StatCard
          label="平台盈利"
          value={`¥${Math.round(stats.netProfit).toLocaleString()}`}
          color={stats.netProfit >= 0 ? "accent" : "red"}
        />
        <StatCard label="总用户" value={String(stats.totalUsers)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="进行中" value={String(stats.activeBetsCount)} />
        <StatCard label="已中奖" value={String(stats.wonBetsCount)} color="accent" />
        <StatCard label="未中奖" value={String(stats.lostBetsCount)} />
      </div>

      {/* User ranking */}
      <div>
        <h2 className="font-display text-base font-semibold mb-3">用户盈亏排行</h2>
        {stats.topUsers.length === 0 ? (
          <div className="text-text-muted text-sm py-4">暂无数据</div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-xs">
                  <th className="text-left py-2.5 px-4 font-medium">排名</th>
                  <th className="text-left py-2.5 px-4 font-medium">昵称</th>
                  <th className="text-right py-2.5 px-4 font-medium">下注数</th>
                  <th className="text-right py-2.5 px-4 font-medium">盈亏</th>
                </tr>
              </thead>
              <tbody>
                {stats.topUsers.map((user, i) => (
                  <tr key={user.nickname} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 px-4">
                      {i < 3 ? (
                        <span>{["🥇", "🥈", "🥉"][i]}</span>
                      ) : (
                        <span className="num text-text-muted">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">{user.nickname}</td>
                    <td className="py-2.5 px-4 text-right num">{user.totalBets}</td>
                    <td className={`py-2.5 px-4 text-right num font-medium ${user.netProfit >= 0 ? "text-accent" : "text-red"}`}>
                      {user.netProfit >= 0 ? "+" : ""}¥{Math.round(user.netProfit)}
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
      <div className="text-text-muted text-xs mb-1">{label}</div>
      <div
        className={`num text-xl font-bold ${
          color === "accent" ? "text-accent" : color === "gold" ? "text-gold" : color === "red" ? "text-red" : "text-text-primary"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
