"use client";

import { useState, useEffect } from "react";

interface BetItem {
  match: { homeTeam: string; awayTeam: string };
  betMarket: string;
  selectedOption: string;
  lockedOdds: number;
}

interface Bet {
  id: number;
  user: { nickname: string };
  betMode: string;
  items: BetItem[];
  totalAmount: number;
  lockedTotalOdds: number;
  potentialPayout: number;
  status: string;
  actualPayout: number | null;
}

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  APPROVED: { label: "已下注", badge: "badge-active" },
  WON: { label: "已中奖", badge: "badge-won" },
  LOST: { label: "未中奖", badge: "badge-lost" },
  CANCELLED: { label: "已取消", badge: "badge-cancelled" },
};

const MARKET_LABELS: Record<string, Record<string, string>> = {
  X1X: { home: "胜", draw: "平", away: "负" },
  TOTAL_GOALS: {},
  CORRECT_SCORE: {},
  HANDICAP_X1X: {},
  HALF_FULL: {},
};

const MARKET_NAMES: Record<string, string> = {
  X1X: "胜平负",
  HANDICAP_X1X: "让球胜平负",
  HALF_FULL: "半全场",
  TOTAL_GOALS: "总进球",
  CORRECT_SCORE: "猜比分",
};

type Tab = "all" | "APPROVED" | "WON" | "LOST";

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    fetch("/api/bets")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const data = (res.data || []).map((bet: Bet) => ({
            ...bet,
            totalAmount: Number(bet.totalAmount),
            lockedTotalOdds: Number(bet.lockedTotalOdds),
            potentialPayout: Number(bet.potentialPayout),
            actualPayout: bet.actualPayout !== null ? Number(bet.actualPayout) : null,
          }));
          setBets(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? bets : bets.filter((bet) => bet.status === tab);
  const approvedCount = bets.filter((bet) => bet.status === "APPROVED").length;
  const wonCount = bets.filter((bet) => bet.status === "WON").length;
  const totalAmount = bets.reduce((sum, bet) => sum + bet.totalAmount, 0);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-full bg-white px-4 py-2 text-sm text-text-muted shadow-sm">加载投注中...</div>
      </div>
    );
  }

  return (
    <div className="px-3 pb-4 pt-3">
      <section className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 text-xs font-bold text-accent">PUBLIC BET SLIPS</div>
            <h2 className="text-xl font-black tracking-tight">玩家投注记录</h2>
            <p className="mt-1 text-xs text-text-muted">所有下注公开透明，管理员统一录入</p>
          </div>
          <div className="rounded-2xl bg-bg-surface px-3 py-2 text-right">
            <div className="num text-2xl font-black text-accent">{bets.length}</div>
            <div className="text-[10px] font-semibold text-text-muted">总下注</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label="已下注" value={approvedCount} />
          <SummaryCard label="已中奖" value={wonCount} highlight />
          <SummaryCard label="总下注额" value={`${Math.round(totalAmount)}`} />
        </div>
      </section>

      <div className="sticky top-0 z-30 -mx-3 mb-3 border-b border-border bg-bg-deep/95 px-3 pb-1 pt-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {([
            { key: "all", label: "全部" },
            { key: "APPROVED", label: "已下注" },
            { key: "WON", label: "已中奖" },
            { key: "LOST", label: "未中奖" },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                tab === item.key
                  ? "bg-accent text-white"
                  : "bg-white text-text-secondary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white py-12 text-center shadow-sm">
            <div className="mb-2 text-3xl">🎫</div>
            <div className="text-sm font-bold text-text-primary">暂无投注记录</div>
            <div className="mt-1 text-xs text-text-muted">有下注后会展示在这里</div>
          </div>
        ) : (
          filtered.map((bet, index) => <BetCard key={bet.id} bet={bet} index={index} />)
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${highlight ? "bg-red/10" : "bg-bg-surface"}`}>
      <div className="text-[10px] font-semibold text-text-muted">{label}</div>
      <div className={`num mt-0.5 text-lg font-black ${highlight ? "text-accent" : "text-text-primary"}`}>{value}</div>
    </div>
  );
}

function BetCard({ bet, index }: { bet: Bet; index: number }) {
  const statusInfo = STATUS_MAP[bet.status] ?? { label: bet.status, badge: "badge-cancelled" };
  const isParlay = bet.betMode === "PARLAY";
  const item = bet.items[0];

  return (
    <article className={`glass rounded-2xl px-3.5 py-3 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
      {/* 第一行：昵称 + 玩法 + 状态 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-extrabold text-text-primary truncate">{bet.user?.nickname || "未知"}</span>
          <span className="shrink-0 text-[10px] font-semibold text-text-muted">{isParlay ? `串关×${bet.items.length}` : "单关"}</span>
        </div>
        <span className={`${statusInfo.badge} shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold`}>{statusInfo.label}</span>
      </div>

      {/* 比赛信息 + 金额 */}
      {isParlay ? (
        <div className="space-y-1.5">
          {bet.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="shrink-0 text-[10px] text-text-muted num">{i + 1}.</span>
                <span className="truncate font-medium text-text-primary">{it.match?.homeTeam || "?"} VS {it.match?.awayTeam || "?"}</span>
                <span className="shrink-0 text-text-muted">·</span>
                <span className="shrink-0 text-accent">{formatOptionLabel(it.betMarket, it.selectedOption)}</span>
                <span className="shrink-0 num text-text-muted">@{Number(it.lockedOdds).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
            <span className="text-[10px] text-text-muted">串关×{bet.items.length} · 赔率 {bet.lockedTotalOdds.toFixed(2)}</span>
            <PayoutLabel bet={bet} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate font-medium text-text-primary">{item.match?.homeTeam || "?"} VS {item.match?.awayTeam || "?"}</span>
            <span className="shrink-0 text-text-muted">·</span>
            <span className="shrink-0 text-accent">{formatOptionLabel(item.betMarket, item.selectedOption)}</span>
            <span className="shrink-0 num text-text-muted">@{Number(item.lockedOdds).toFixed(2)}</span>
          </div>
          <PayoutLabel bet={bet} />
        </div>
      )}
    </article>
  );
}

function PayoutLabel({ bet }: { bet: Bet }) {
  const amount = Math.round(bet.totalAmount);
  const potential = Math.round(bet.potentialPayout);

  if (bet.status === "WON" && bet.actualPayout !== null) {
    return <span className="shrink-0 text-right num text-xs font-bold text-accent">奖励:{Math.round(bet.actualPayout)}</span>;
  }
  if (bet.status === "LOST") {
    return <span className="shrink-0 text-right num text-xs text-text-secondary">投注:{amount}</span>;
  }
  return (
    <span className="shrink-0 text-right text-xs text-text-muted">
      <span className="num">投注:{amount}</span>
      <span className="mx-1">·</span>
      <span className="num">预计奖励:{potential}</span>
    </span>
  );
}

function formatOptionLabel(market: string, option: string) {
  if (market === "HANDICAP_X1X") {
    const labels: Record<string, string> = { home: "让胜", draw: "让平", away: "让负" };
    const [handicap, key] = option.includes(":") ? option.split(":") : ["", option];
    return `${handicap}${labels[key] || key}`;
  }
  return MARKET_LABELS[market]?.[option] ?? option;
}
