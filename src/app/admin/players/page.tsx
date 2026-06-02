"use client";

import { useState, useEffect } from "react";

interface Player {
  id: number;
  username: string;
  nickname: string;
  status: string;
  balance: number;
  totalBets: number;
  netProfit: number;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showRecharge, setShowRecharge] = useState<Player | null>(null);
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeRemark, setRechargeRemark] = useState("");
  const [actionType, setActionType] = useState<"add" | "deduct">("add");

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/players");
      const data = await res.json();
      if (data.success) {
        setPlayers(
          (data.data || []).map((p: Player) => ({
            ...p,
            balance: Number(p.balance ?? 0),
            netProfit: Number(p.netProfit ?? 0),
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async () => {
    if (!username || !nickname) return;
    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, nickname }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        setUsername("");
        setNickname("");
        loadPlayers();
      } else {
        alert(data.error || "添加失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  const handleRecharge = async () => {
    if (!showRecharge || !rechargeAmount) return;
    const amount = Number(rechargeAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: showRecharge.id,
          balanceDelta: actionType === "add" ? amount : -amount,
          remark: rechargeRemark || (actionType === "add" ? "充值" : "扣减"),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRecharge(null);
        setRechargeAmount("");
        setRechargeRemark("");
        loadPlayers();
      } else {
        alert(data.error || "操作失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  const toggleStatus = async (player: Player) => {
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: player.id,
          status: player.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
        }),
      });
      const data = await res.json();
      if (data.success) loadPlayers();
    } catch {
      alert("操作失败");
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">玩家管理</h2>
          <p className="text-text-muted text-xs mt-1">管理参与下注的玩家，手动添加和充值</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-sm">{players.length} 位玩家</span>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-3 py-1.5 rounded-lg text-sm">
            {showAdd ? "收起" : "+ 添加玩家"}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="glass rounded-xl p-4 mb-4 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">用户名</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="如 xiaoming"
                className="input-field w-full rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">昵称</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="如 小明"
                className="input-field w-full rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!username || !nickname}
            className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-40"
          >
            确认添加
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs">
                <th className="text-left py-3 px-4 font-medium">玩家</th>
                <th className="text-center py-3 px-4 font-medium">状态</th>
                <th className="text-right py-3 px-4 font-medium">余额</th>
                <th className="text-right py-3 px-4 font-medium">下注数</th>
                <th className="text-right py-3 px-4 font-medium">盈亏</th>
                <th className="text-right py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 px-4">
                    <span className="font-medium">{player.nickname}</span>
                    <div className="text-text-muted text-[10px]">@{player.username}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        player.status === "ACTIVE" ? "bg-accent/15 text-accent" : "bg-red/10 text-red"
                      }`}
                    >
                      {player.status === "ACTIVE" ? "正常" : "禁用"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right num">¥{player.balance.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right num text-text-secondary">{player.totalBets}</td>
                  <td className={`py-3 px-4 text-right num font-medium ${player.netProfit >= 0 ? "text-accent" : "text-red"}`}>
                    {player.netProfit >= 0 ? "+" : ""}¥{player.netProfit}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => { setShowRecharge(player); setActionType("add"); }}
                        className="text-xs px-2.5 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        充值
                      </button>
                      <button
                        onClick={() => { setShowRecharge(player); setActionType("deduct"); }}
                        className="text-xs px-2.5 py-1 rounded bg-red/10 text-red hover:bg-red/20 transition-colors"
                      >
                        扣减
                      </button>
                      <button
                        onClick={() => toggleStatus(player)}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${
                          player.status === "ACTIVE"
                            ? "bg-red/10 text-red hover:bg-red/20"
                            : "bg-accent/10 text-accent hover:bg-accent/20"
                        }`}
                      >
                        {player.status === "ACTIVE" ? "禁用" : "启用"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recharge modal */}
      {showRecharge && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4">
          <div className="bg-bg-surface w-full max-w-sm rounded-2xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold">
                {actionType === "add" ? "充值" : "扣减"} · {showRecharge.nickname}
              </h3>
              <button onClick={() => setShowRecharge(null)} className="text-text-muted hover:text-text-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-text-secondary text-sm mb-4">
              当前余额: <span className="num text-text-primary font-medium">¥{showRecharge.balance.toLocaleString()}</span>
            </div>
            <div className="space-y-3">
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="输入金额"
                className="input-field w-full rounded-xl px-4 py-3 num text-sm"
                min="1"
              />
              <input
                type="text"
                value={rechargeRemark}
                onChange={(e) => setRechargeRemark(e.target.value)}
                placeholder="备注（如：微信转账）"
                className="input-field w-full rounded-xl px-4 py-3 text-sm"
              />
              <button
                onClick={handleRecharge}
                disabled={!rechargeAmount}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  actionType === "add" ? "btn-primary" : "bg-red text-white hover:opacity-90"
                } disabled:opacity-40`}
              >
                确认{actionType === "add" ? "充值" : "扣减"} ¥{rechargeAmount || "0"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
