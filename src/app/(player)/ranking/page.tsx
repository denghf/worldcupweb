"use client";

import { useState, useEffect } from "react";
import multiavatar from "@multiavatar/multiavatar";

interface Ranking {
  rank: number;
  nickname: string;
  totalBets: number;
  totalWonBets: number;
  totalBetAmount: number;
  totalWinAmount: number;
  netProfit: number;
  winRate: number;
}

type SortKey = "totalWinAmount" | "netProfit" | "winRate" | "totalBetAmount";

export default function RankingPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("totalWinAmount");

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

  const sorted = [...rankings].sort((a, b) => {
    if (sortBy === "totalWinAmount") return b.totalWinAmount - a.totalWinAmount;
    if (sortBy === "netProfit") return b.netProfit - a.netProfit;
    if (sortBy === "winRate") return b.winRate - a.winRate;
    return b.totalBetAmount - a.totalBetAmount;
  });
  const ranked = sorted.map((item, index) => ({ ...item, rank: index + 1 }));

  const bigWinner = [...rankings].sort((a, b) => b.netProfit - a.netProfit)[0];
  const bigSpender = [...rankings].sort((a, b) => b.totalBetAmount - a.totalBetAmount)[0];
  const luckyStar = [...rankings]
    .filter((p) => p.totalBets > 0)
    .sort((a, b) => b.winRate - a.winRate)[0];

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
    <div className="bg-pattern px-3 pb-4">
      <section className="relative -mx-3 text-white">
        <img
          src="/ranking.png"
          alt="竞猜排行榜"
          className="h-auto w-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {bigSpender && (
          <div className="absolute flex flex-col items-center gap-1" style={{ left: "17.5%", top: "62%", transform: "translate(-50%, -50%)" }}>
            <Avatar player={bigSpender} size="2xl" />
            <div className="max-w-[90px] truncate text-xs font-bold text-black">{bigSpender.nickname}</div>
          </div>
        )}
        {bigWinner && (
          <div className="absolute flex flex-col items-center gap-1.5" style={{ left: "50%", top: "56%", transform: "translate(-50%, -50%)" }}>
            <Avatar player={bigWinner} size="4xl" />
            <div className="max-w-[120px] truncate text-sm font-bold text-black">{bigWinner.nickname}</div>
          </div>
        )}
        {luckyStar && (
          <div className="absolute flex flex-col items-center gap-1" style={{ left: "82.5%", top: "62%", transform: "translate(-50%, -50%)" }}>
            <Avatar player={luckyStar} size="2xl" />
            <div className="max-w-[90px] truncate text-xs font-bold text-black">{luckyStar.nickname}</div>
          </div>
        )}
      </section>

      <div className="sticky top-0 z-30 -mx-3 mb-3 border-b border-border bg-bg-deep/95 px-3 pb-1 pt-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSortBy("totalWinAmount")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              sortBy === "totalWinAmount"
                ? "bg-accent text-white"
                : "bg-white text-text-secondary"
            }`}
          >
            中奖额
          </button>
          <button
            onClick={() => setSortBy("totalBetAmount")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              sortBy === "totalBetAmount"
                ? "bg-accent text-white"
                : "bg-white text-text-secondary"
            }`}
          >
            投注额
          </button>
          <button
            onClick={() => setSortBy("winRate")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              sortBy === "winRate"
                ? "bg-accent text-white"
                : "bg-white text-text-secondary"
            }`}
          >
            命中率
          </button>
          <button
            onClick={() => setSortBy("netProfit")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              sortBy === "netProfit"
                ? "bg-accent text-white"
                : "bg-white text-text-secondary"
            }`}
          >
            积分
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-[42px_1fr_60px_60px_48px_60px] border-b border-border px-3 py-2 text-[10px] font-bold text-text-muted">
          <span>排名</span>
          <span>用户</span>
          <span className="text-right">中奖额</span>
          <span className="text-right">投注额</span>
          <span className="text-right">命中率</span>
          <span className="text-right">积分</span>
        </div>
        {ranked.map((player, index) => (
          <RankingRow key={player.nickname} player={player} index={index} />
        ))}
      </div>

      <div className="mt-3 text-center text-[10px] font-semibold text-text-muted">排行每次结算后自动更新一次</div>
    </div>
  );
}

function RankingRow({ player, index }: { player: Ranking; index: number }) {
  const medal = ["🥇", "🥈", "🥉"][player.rank - 1];

  return (
    <div className={`grid grid-cols-[42px_1fr_60px_60px_48px_60px] items-center border-b border-border/60 px-3 py-3 last:border-0 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
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
      <div className="num text-right text-xs font-bold text-accent">{player.totalWinAmount}</div>
      <div className="num text-right text-xs font-bold text-text-secondary">{player.totalBetAmount}</div>
      <div className="num text-right text-xs font-bold text-text-secondary">{player.winRate}%</div>
      <div className={`num text-right text-sm font-black ${player.netProfit >= 0 ? "text-accent" : "text-text-secondary"}`}>
        {player.netProfit >= 0 ? "+" : ""}{player.netProfit}
      </div>
    </div>
  );
}

function Avatar({ player, size = "md" }: { player: Ranking; size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" }) {
  const dimension =
    size === "4xl" ? "h-28 w-28" :
    size === "3xl" ? "h-24 w-24" :
    size === "2xl" ? "h-20 w-20" :
    size === "xl" ? "h-16 w-16" :
    size === "lg" ? "h-12 w-12" :
    size === "sm" ? "h-6 w-6" :
    "h-9 w-9";
  const avatar = multiavatar(player.nickname);

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full bg-bg-surface ${dimension}`}
      aria-label={player.nickname}
      dangerouslySetInnerHTML={{ __html: avatar }}
    />
  );
}
