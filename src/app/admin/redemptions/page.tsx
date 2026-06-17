"use client";

import { useState, useEffect } from "react";
import { AdminMobileTopBar } from "@/components/admin/mobile-nav";

interface WinRecord {
  id: number;
  betUid: string;
  nickname: string;
  betAmount: number;
  lockedTotalOdds: number;
  winAmount: number;
  match: string;
  option: string;
  settledAt: string;
}

export default function RedemptionsPage() {
  const [wins, setWins] = useState<WinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/redemptions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWins(data.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const uniqueNames = Array.from(new Set(wins.map((w) => w.nickname).filter(Boolean)));
  const filtered = nameFilter ? wins.filter((w) => w.nickname === nameFilter) : wins;
  const totalPending = filtered.reduce((s, w) => s + w.winAmount, 0);

  return (
    <div className="max-w-4xl">
      <AdminMobileTopBar title="兑奖管理" />

      <div className="hidden md:block mb-4">
        <h2 className="font-display text-lg font-semibold mb-1">兑奖管理</h2>
        <p className="text-text-muted text-sm">管理中奖玩家的兑付情况</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 mt-3 md:mt-0">
        <div className="glass rounded-xl px-4 py-3">
          <div className="text-text-muted text-sm mb-1">中奖笔数</div>
          <div className="text-xl font-bold text-gold">{filtered.length}</div>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <div className="text-text-muted text-sm mb-1">中奖总额</div>
          <div className="text-xl font-bold text-accent">
            {totalPending.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <select
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="input-field rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">全部玩家</option>
          {uniqueNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-text-muted text-sm py-8 text-center">暂无中奖记录</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((win) => (
            <div key={win.id} className="glass rounded-xl px-4 py-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{win.nickname}</span>
                    <span className="text-text-muted text-sm">{win.betUid}</span>
                  </div>
                  <div className="text-text-secondary text-sm mt-0.5">
                    {win.match} · <span className="text-accent">{win.option}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-3 text-sm">
                  <span className="text-text-secondary rounded-lg bg-bg-surface px-2 py-1 md:bg-transparent md:p-0">下注: {win.betAmount.toFixed(1)}</span>
                  <span className="text-text-secondary rounded-lg bg-bg-surface px-2 py-1 md:bg-transparent md:p-0">赔率: {win.lockedTotalOdds.toFixed(2)}</span>
                  <span className="text-accent font-semibold rounded-lg bg-accent/5 px-2 py-1 md:bg-transparent md:p-0 col-span-2 md:col-span-1">获奖: +{win.winAmount.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">
                  结算时间: {win.settledAt ? new Date(win.settledAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                </span>
                <span className="text-sm bg-accent/10 text-accent px-2 py-0.5 rounded-full">已自动发放</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
