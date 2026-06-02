"use client";

import { useState, useEffect } from "react";

interface BetItem {
  match: { homeTeam: string; awayTeam: string };
  betMarket: string;
  selectedOption: string;
  lockedOdds: number;
  result: string;
}

interface Bet {
  id: number;
  betUid: string;
  user: { nickname: string };
  betMode: string;
  totalAmount: number;
  lockedTotalOdds: number;
  potentialPayout: number;
  actualPayout: number | null;
  status: string;
  createdAt: string;
  settledAt: string | null;
  items: BetItem[];
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
};

const MARKET_NAMES: Record<string, string> = {
  X1X: "胜平负",
  HANDICAP_X1X: "让球胜平负",
  HALF_FULL: "半全场",
  TOTAL_GOALS: "总进球",
  CORRECT_SCORE: "猜比分",
};

const RESULT_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待定", color: "text-text-muted" },
  WON: { label: "命中", color: "text-accent" },
  LOST: { label: "未中", color: "text-red" },
  CANCELLED: { label: "取消", color: "text-text-muted" },
};

type Filter = "ALL" | "ACTIVE" | "WON" | "LOST" | "PENDING_REVIEW" | "APPROVED";

export default function BetDetailsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [expandedBet, setExpandedBet] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/bets")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBets(
            (data.data || []).map((b: Bet) => ({
              ...b,
              totalAmount: Number(b.totalAmount),
              lockedTotalOdds: Number(b.lockedTotalOdds),
              potentialPayout: Number(b.potentialPayout),
              actualPayout: b.actualPayout ? Number(b.actualPayout) : null,
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? bets : bets.filter((b) => b.status === filter);

  return (
    <div className="max-w-4xl">
      <h2 className="font-display text-lg font-semibold mb-1">下注详情</h2>
      <p className="text-text-muted text-xs mb-4">查看每笔下注的详细内容</p>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {([
          { key: "ALL", label: "全部" },
          { key: "PENDING_REVIEW", label: "待审核" },
          { key: "APPROVED", label: "已生效" },
          { key: "ACTIVE", label: "进行中" },
          { key: "WON", label: "已中奖" },
          { key: "LOST", label: "未中奖" },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.key
                ? "bg-accent/15 text-accent border border-accent/30"
                : "glass text-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-text-muted text-sm py-8 text-center">暂无下注记录</div>
          ) : (
            filtered.map((bet) => {
              const statusInfo = STATUS_MAP[bet.status] ?? { label: bet.status, badge: "" };
              const isExpanded = expandedBet === bet.id;

              return (
                <div key={bet.id} className="glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedBet(isExpanded ? null : bet.id)}
                    className="w-full px-4 py-3 text-left"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{bet.user?.nickname || "未知"}</span>
                        {bet.betMode === "PARLAY" && (
                          <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
                            串关 ×{bet.items.length}
                          </span>
                        )}
                        <span className="text-text-muted text-[10px]">{bet.betUid}</span>
                      </div>
                      <span className={`${statusInfo.badge} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">
                        {new Date(bet.createdAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="num text-text-secondary">赔率 {bet.lockedTotalOdds.toFixed(2)}</span>
                        <span className="num font-medium">¥{bet.totalAmount}</span>
                        {bet.status === "WON" && bet.actualPayout !== null && (
                          <span className="num text-accent font-semibold">+¥{Math.round(bet.actualPayout).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-border pt-3 space-y-2 animate-fade-in-up">
                      {bet.items.map((item, j) => {
                        const optionLabel = formatOptionLabel(item.betMarket, item.selectedOption);
                        const resultInfo = RESULT_MAP[item.result] ?? { label: item.result, color: "" };
                        return (
                          <div key={j} className="flex items-center justify-between bg-bg-primary rounded-lg px-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary">{item.match.homeTeam} vs {item.match.awayTeam}</span>
                              <span className="text-text-muted">{MARKET_NAMES[item.betMarket] ?? item.betMarket}</span>
                              <span className="text-accent">{optionLabel}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="num text-text-muted">@ {Number(item.lockedOdds).toFixed(2)}</span>
                              <span className={resultInfo.color}>{resultInfo.label}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-text-muted">潜在赔付</span>
                        <span className="num text-text-secondary">¥{Math.round(bet.potentialPayout).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
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
