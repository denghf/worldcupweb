"use client";

import { useState, useEffect } from "react";

interface Ranking {
  rank: number;
  nickname: string;
  avatar: string | null;
  totalBets: number;
  totalWonBets: number;
  totalBetAmount: number;
  totalWinAmount: number;
  netProfit: number;
  winRate: number;
}

type SortKey = "netProfit" | "winRate";

export default function RankingPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("netProfit");

  useEffect(() => {
    fetch("/api/ranking")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const data = (res.data || []).map((ranking: Ranking) => ({
            ...ranking,
            totalBetAmount: Number(ranking.totalBetAmount),
            totalWinAmount: Number(ranking.totalWinAmount),
            netProfit: Number(ranking.netProfit),
          }));
          setRankings(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...rankings].sort((a, b) =>
    sortBy === "netProfit" ? b.netProfit - a.netProfit : b.winRate - a.winRate
  );
  const ranked = sorted.map((item, index) => ({ ...item, rank: index + 1 }));
  const champion = ranked[0];

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-full bg-white px-4 py-2 text-sm text-text-muted shadow-sm">加载排行中...</div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">🏆</div>
        <div className="mb-1 text-sm font-bold text-text-primary">暂无排名数据</div>
        <div className="text-xs text-text-muted">等有下注结算后自动生成</div>
      </div>
    );
  }

  return (
    <div className="bg-pattern px-3 pb-4 pt-3">
      <section className="mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#cf0010] via-accent to-[#f45518] p-4 text-white shadow-[0_14px_34px_rgba(230,0,18,0.22)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="mb-1 text-xs font-semibold opacity-80">2026世界杯竞猜</div>
            <h2 className="text-2xl font-black tracking-tight">竞猜排行榜</h2>
            <p className="mt-1 text-xs opacity-80">按结算结果实时更新名次</p>
          </div>
          <div className="text-5xl drop-shadow-sm">🏆</div>
        </div>
        {champion && (
          <div className="rounded-2xl bg-white/16 p-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Avatar player={champion} size="lg" />
                <div>
                  <div className="text-[10px] font-semibold opacity-75">当前榜首</div>
                  <div className="text-base font-black">{champion.nickname}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="num text-xl font-black">{champion.netProfit >= 0 ? "+" : ""}¥{Math.round(champion.netProfit)}</div>
                <div className="text-[10px] opacity-75">胜率 {champion.winRate}%</div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-3 grid grid-cols-3 gap-2">
        <StatTile icon="🏆" label="榜首盈利" value={`¥${Math.round(champion?.netProfit ?? 0)}`} />
        <StatTile icon="🪙" label="总返奖" value={`¥${Math.round(rankings.reduce((sum, player) => sum + player.totalWinAmount, 0))}`} />
        <StatTile icon="🎯" label="最高胜率" value={`${Math.max(...rankings.map((player) => player.winRate))}%`} />
      </section>

      <div className="sticky top-12 z-30 -mx-3 mb-3 border-b border-border bg-bg-deep/95 px-3 pb-2 pt-1 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSortBy("netProfit")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              sortBy === "netProfit"
                ? "bg-accent text-white shadow-[0_8px_18px_rgba(230,0,18,0.18)]"
                : "bg-white text-text-secondary shadow-sm"
            }`}
          >
            总榜
          </button>
          <button
            onClick={() => setSortBy("winRate")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              sortBy === "winRate"
                ? "bg-accent text-white shadow-[0_8px_18px_rgba(230,0,18,0.18)]"
                : "bg-white text-text-secondary shadow-sm"
            }`}
          >
            命中率
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-[42px_1fr_72px_54px] border-b border-border px-3 py-2 text-[10px] font-bold text-text-muted">
          <span>排名</span>
          <span>用户</span>
          <span className="text-right">积分</span>
          <span className="text-right">命中率</span>
        </div>
        {ranked.map((player, index) => (
          <RankingRow key={player.nickname} player={player} index={index} />
        ))}
      </div>

      <div className="mt-3 text-center text-[10px] font-semibold text-text-muted">排行每次结算后自动更新一次</div>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
      <div className="mb-1 text-xl">{icon}</div>
      <div className="text-[10px] font-semibold text-text-muted">{label}</div>
      <div className="num mt-0.5 text-base font-black text-text-primary">{value}</div>
    </div>
  );
}

function RankingRow({ player, index }: { player: Ranking; index: number }) {
  const medal = ["🥇", "🥈", "🥉"][player.rank - 1];

  return (
    <div className={`grid grid-cols-[42px_1fr_72px_54px] items-center border-b border-border/60 px-3 py-3 last:border-0 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
      <div className="text-sm font-black text-text-secondary">
        {medal ? <span className="text-lg">{medal}</span> : <span className="num pl-1 text-xs">{player.rank}</span>}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar player={player} />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-text-primary">{player.nickname}</div>
          <div className="text-[10px] font-semibold text-text-muted">{player.totalBets} 注 · 赢 {player.totalWonBets} 注</div>
        </div>
      </div>
      <div className={`num text-right text-sm font-black ${player.netProfit >= 0 ? "text-accent" : "text-text-secondary"}`}>
        {player.netProfit >= 0 ? "+" : ""}{Math.round(player.netProfit)}
      </div>
      <div className="num text-right text-xs font-bold text-text-secondary">{player.winRate}%</div>
    </div>
  );
}

function Avatar({ player, size = "md" }: { player: Ranking; size?: "md" | "lg" }) {
  const dimension = size === "lg" ? "h-12 w-12 text-lg" : "h-9 w-9 text-sm";

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red/10 to-gold/20 font-black text-accent shadow-inner ${dimension}`}>
      {player.avatar || player.nickname.slice(0, 1)}
    </div>
  );
}
