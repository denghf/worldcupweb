"use client";

import { useState, useEffect } from "react";

interface WinRecord {
  id: number;
  betUid: string;
  nickname: string;
  winAmount: number;
  match: string;
  option: string;
  settledAt: string;
}

export default function RedemptionsPage() {
  const [wins, setWins] = useState<WinRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalPending = wins.reduce((s, w) => s + w.winAmount, 0);

  return (
    <div className="max-w-4xl">
      <h2 className="font-display text-lg font-semibold mb-1">兑奖管理</h2>
      <p className="text-text-muted text-xs mb-4">管理中奖玩家的兑付情况</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-xl px-4 py-3">
          <div className="text-text-muted text-xs mb-1">中奖笔数</div>
          <div className="num text-xl font-bold text-gold">{wins.length}</div>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <div className="text-text-muted text-xs mb-1">中奖总额</div>
          <div className="num text-xl font-bold text-accent">
            ¥{Math.round(totalPending).toLocaleString()}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : wins.length === 0 ? (
        <div className="text-text-muted text-sm py-8 text-center">暂无中奖记录</div>
      ) : (
        <div className="space-y-2">
          {wins.map((win) => (
            <div key={win.id} className="glass rounded-xl px-4 py-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{win.nickname}</span>
                    <span className="text-text-muted text-[10px]">{win.betUid}</span>
                  </div>
                  <div className="text-text-secondary text-xs mt-0.5">
                    {win.match} · <span className="text-accent">{win.option}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-accent font-semibold text-sm">+¥{Math.round(win.winAmount).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-xs">
                  结算时间: {win.settledAt ? new Date(win.settledAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                </span>
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">已自动发放</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
