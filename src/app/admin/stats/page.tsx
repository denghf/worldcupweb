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
  dailyBets: { date: string; bets: number; amount: number; payout: number }[];
}

export default function StatsPage() {
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
      <div className="max-w-4xl space-y-6">
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

  const maxAmount = Math.max(...stats.dailyBets.map((d) => d.amount), 1);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold mb-1">统计</h2>
        <p className="text-text-muted text-xs">平台运营数据总览</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl px-4 py-4">
          <div className="text-text-muted text-xs mb-1">总下注笔数</div>
          <div className="num text-xl font-bold">{stats.totalBets}</div>
        </div>
        <div className="glass rounded-xl px-4 py-4">
          <div className="text-text-muted text-xs mb-1">总下注额</div>
          <div className="num text-xl font-bold">¥{Math.round(stats.totalBetAmount).toLocaleString()}</div>
        </div>
        <div className="glass rounded-xl px-4 py-4">
          <div className="text-text-muted text-xs mb-1">总赔付</div>
          <div className="num text-xl font-bold text-accent">¥{Math.round(stats.totalPayout).toLocaleString()}</div>
        </div>
        <div className="glass rounded-xl px-4 py-4">
          <div className="text-text-muted text-xs mb-1">平台盈余</div>
          <div className={`num text-xl font-bold ${stats.netProfit >= 0 ? "text-accent" : "text-red"}`}>
            ¥{Math.round(stats.netProfit).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bet status breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl px-4 py-3">
          <div className="text-text-muted text-xs mb-1">进行中</div>
          <div className="num text-lg font-semibold text-blue-400">{stats.activeBetsCount}</div>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <div className="text-text-muted text-xs mb-1">已中奖</div>
          <div className="num text-lg font-semibold text-accent">{stats.wonBetsCount}</div>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <div className="text-text-muted text-xs mb-1">未中奖</div>
          <div className="num text-lg font-semibold text-red">{stats.lostBetsCount}</div>
        </div>
      </div>

      {/* Daily chart */}
      {stats.dailyBets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">近7日下注趋势</h3>
          <div className="glass rounded-xl p-4">
            <div className="flex items-end gap-2 h-40">
              {stats.dailyBets.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center gap-0.5">
                    <span className="num text-[9px] text-text-muted">¥{(d.amount / 1000).toFixed(0)}k</span>
                    <div className="w-full bg-accent/20 rounded-t" style={{ height: `${(d.amount / maxAmount) * 100}px` }}>
                      <div className="w-full bg-accent/40 rounded-t" style={{ height: `${d.amount > 0 ? (d.payout / d.amount) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span className="text-text-muted text-[10px]">{d.date}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-text-muted">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-accent/20 rounded" /> 下注额
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-accent/40 rounded" /> 赔付额
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
