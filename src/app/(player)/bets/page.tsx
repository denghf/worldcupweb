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
  PENDING_REVIEW: { label: "待审核", badge: "badge-pending" },
  APPROVED: { label: "已生效", badge: "badge-active" },
  ACTIVE: { label: "进行中", badge: "badge-active" },
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

type Tab = "all" | "ACTIVE" | "WON" | "LOST";

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
  const activeCount = bets.filter((bet) => bet.status === "ACTIVE").length;
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
    <div className="bg-pattern px-3 pb-4 pt-3">
      <section className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 text-xs font-bold text-accent">PUBLIC BET SLIPS</div>
            <h2 className="text-xl font-black tracking-tight">玩家投注记录</h2>
            <p className="mt-1 text-xs text-text-muted">所有下注公开透明，管理员统一录入</p>
          </div>
          <div className="rounded-2xl bg-bg-surface px-3 py-2 text-right">
            <div className="num text-2xl font-black text-accent">{bets.length}</div>
            <div className="text-[10px] font-semibold text-text-muted">总票数</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label="进行中" value={activeCount} />
          <SummaryCard label="已中奖" value={wonCount} highlight />
          <SummaryCard label="总下注" value={`¥${Math.round(totalAmount)}`} />
        </div>
      </section>

      <div className="sticky top-12 z-30 -mx-3 mb-3 border-b border-border bg-bg-deep/95 px-3 pb-2 pt-1 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { key: "all", label: "全部" },
            { key: "ACTIVE", label: "进行中" },
            { key: "WON", label: "已中奖" },
            { key: "LOST", label: "未中奖" },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                tab === item.key
                  ? "bg-accent text-white shadow-[0_8px_18px_rgba(230,0,18,0.18)]"
                  : "bg-white text-text-secondary shadow-sm"
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
  const payoutText = bet.status === "WON" && bet.actualPayout !== null
    ? `+¥${Math.round(bet.actualPayout)}`
    : bet.status === "LOST"
      ? `-¥${Math.round(bet.totalAmount)}`
      : `可赢 ¥${Math.round(bet.potentialPayout)}`;

  return (
    <article className={`glass rounded-2xl p-3.5 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={bet.user?.nickname || "未知"} />
          <div>
            <div className="text-sm font-extrabold text-text-primary">{bet.user?.nickname || "未知玩家"}</div>
            <div className="text-[10px] font-semibold text-text-muted">{bet.betMode === "PARLAY" ? `串关 ×${bet.items.length}` : "单关"}</div>
          </div>
        </div>
        <span className={`${statusInfo.badge} rounded-full px-2.5 py-1 text-[10px] font-bold`}>{statusInfo.label}</span>
      </div>

      <div className="space-y-1.5">
        {bet.items.map((item, itemIndex) => {
          const optionLabel = formatOptionLabel(item.betMarket, item.selectedOption);
          return (
            <div key={itemIndex} className="rounded-xl border border-border bg-bg-surface px-3 py-2">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="truncate text-xs font-bold text-text-primary">
                  {item.match?.homeTeam || "?"} VS {item.match?.awayTeam || "?"}
                </span>
                <span className="num text-xs font-black text-accent">@ {Number(item.lockedOdds).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-text-muted">
                <span>{MARKET_NAMES[item.betMarket] ?? item.betMarket}</span>
                <span className="h-1 w-1 rounded-full bg-text-muted/50" />
                <span className="text-accent">{optionLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <TicketMetric label="下注" value={`¥${Math.round(bet.totalAmount)}`} />
        <TicketMetric label="总赔率" value={bet.lockedTotalOdds.toFixed(2)} />
        <TicketMetric label={bet.status === "WON" ? "返奖" : bet.status === "LOST" ? "结果" : "预计"} value={payoutText} highlight={bet.status !== "LOST"} />
      </div>
    </article>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red/10 to-gold/20 text-sm font-black text-accent shadow-inner">
      {name.slice(0, 1)}
    </div>
  );
}

function TicketMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-text-muted">{label}</div>
      <div className={`num mt-0.5 text-sm font-black ${highlight ? "text-accent" : "text-text-primary"}`}>{value}</div>
    </div>
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
