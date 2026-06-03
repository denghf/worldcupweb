"use client";

import { useState, useEffect } from "react";
import multiavatar from "@multiavatar/multiavatar";

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

type SortKey = "netProfit" | "winRate" | "totalBetAmount";

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

  const sorted = [...rankings].sort((a, b) => {
    if (sortBy === "netProfit") return b.netProfit - a.netProfit;
    if (sortBy === "winRate") return b.winRate - a.winRate;
    return b.totalBetAmount - a.totalBetAmount;
  });
  const ranked = sorted.map((item, index) => ({ ...item, rank: index + 1 }));
  const champion = ranked[0];

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
      <section className="-mx-3 mb-3 bg-gradient-to-r from-accent to-red-dim text-white">
        <img
          src="/banner-ranking.png"
          alt="竞猜排行榜"
          className="w-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </section>

      <section className="mb-3 grid grid-cols-3 gap-2">
        <TopPlayerCard title="大赢家" player={bigWinner} value={bigWinner ? `${Math.round(bigWinner.netProfit >= 0 ? bigWinner.netProfit : 0)}` : "-"} />
        <TopPlayerCard title="大财主" player={bigSpender} value={bigSpender ? `${Math.round(bigSpender.totalBetAmount)}` : "-"} />
        <TopPlayerCard title="手气王" player={luckyStar} value={luckyStar ? `${luckyStar.winRate}%` : "-"} />
      </section>

      <div className="sticky top-0 z-30 -mx-3 mb-3 border-b border-border bg-bg-deep/95 px-3 pb-1 pt-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSortBy("netProfit")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              sortBy === "netProfit"
                ? "bg-accent text-white"
                : "bg-white text-text-secondary"
            }`}
          >
            总榜
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
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-[42px_1fr_72px_72px_54px] border-b border-border px-3 py-2 text-[10px] font-bold text-text-muted">
          <span>排名</span>
          <span>用户</span>
          <span className="text-right">积分</span>
          <span className="text-right">投注额</span>
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

function TopPlayerCard({ title, player, value }: { title: string; player?: Ranking; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
      <div className="text-[10px] font-semibold text-text-muted mb-2">{title}</div>
      {player ? (
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-8">
            <Avatar player={player} size="md" />
          </div>
          <div className="text-xs font-bold text-text-primary truncate max-w-full">{player.nickname}</div>
          <div className="num text-sm font-black text-accent">{value}</div>
        </div>
      ) : (
        <div className="num text-base font-black text-text-primary">{value}</div>
      )}
    </div>
  );
}

function RankingRow({ player, index }: { player: Ranking; index: number }) {
  const medal = ["🥇", "🥈", "🥉"][player.rank - 1];

  return (
    <div className={`grid grid-cols-[42px_1fr_72px_72px_54px] items-center border-b border-border/60 px-3 py-3 last:border-0 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
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
      <div className="num text-right text-xs font-bold text-text-secondary">{Math.round(player.totalBetAmount)}</div>
      <div className="num text-right text-xs font-bold text-text-secondary">{player.winRate}%</div>
    </div>
  );
}

function Avatar({ player, size = "md" }: { player: Ranking; size?: "md" | "lg" }) {
  const dimension = size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const svgCode = multiavatar(player.nickname);

  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden ${dimension}`}
      dangerouslySetInnerHTML={{ __html: svgCode }}
    />
  );
}
