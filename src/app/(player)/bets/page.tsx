"use client";

import { useState, useEffect } from "react";
import { BetCard, type BetCardData } from "@/components/BetCard";

type Tab = "all" | "APPROVED" | "WON" | "LOST";

export default function BetsPage() {
  const [bets, setBets] = useState<BetCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    fetch("/api/bets")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const data = (res.data || []).map((bet: BetCardData) => ({
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
          <SummaryCard label="总下注额" value={`${totalAmount.toFixed(1)}`} />
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
