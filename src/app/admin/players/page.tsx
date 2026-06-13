"use client";

import { useState, useEffect } from "react";

interface Player {
  id: number;
  username: string;
  nickname: string;
  mustChangePwd: boolean;
  status: string;
  balance: number;
  totalBets: number;
  totalBetAmount: number;
  totalWonBets: number;
  totalWinAmount: number;
  netProfit: number;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNickname, setEditNickname] = useState("");

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

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEditNickname(player.nickname);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNickname("");
  };

  const saveEdit = async (player: Player) => {
    if (!editNickname.trim()) return;
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: player.id, nickname: editNickname.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        setEditNickname("");
        loadPlayers();
      } else {
        alert(data.error || "修改失败");
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

  const updateBalance = async (player: Player) => {
    const input = prompt("请输入新的下注余额：", String(player.balance));
    if (input === null) return;
    const balance = Number(input);
    if (!Number.isFinite(balance) || balance < 0) return alert("请输入不小于 0 的数字");
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: player.id, balance }),
      });
      const data = await res.json();
      if (data.success) {
        loadPlayers();
      } else {
        alert(data.error || "修改失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  const resetPassword = async (player: Player) => {
    if (!confirm("确定将密码重置为 123456？玩家下次登录需重新设置密码")) return;
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: player.id, resetPassword: true }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.data.message);
        loadPlayers();
      } else {
        alert(data.error || "重置失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">玩家管理</h2>
          <p className="text-text-muted text-sm mt-1">管理参与下注的玩家</p>
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
              <label className="text-sm text-text-secondary mb-1 block">用户名</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="如 xiaoming"
                className="input-field w-full rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">昵称</label>
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
        <div className="glass rounded-xl overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-sm">
                <th className="text-left py-3 px-4 font-medium">玩家</th>
                <th className="text-center py-3 px-4 font-medium">状态</th>
                <th className="text-right py-3 px-4 font-medium">余额</th>
                <th className="text-right py-3 px-4 font-medium">下注数</th>
                <th className="text-right py-3 px-4 font-medium">下注总额</th>
                <th className="text-right py-3 px-4 font-medium">中奖数</th>
                <th className="text-right py-3 px-4 font-medium">中奖总额</th>
                <th className="text-right py-3 px-4 font-medium">盈亏</th>
                <th className="text-right py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 px-4">
                    {editingId === player.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editNickname}
                          onChange={(e) => setEditNickname(e.target.value)}
                          className="input-field rounded px-2 py-1 text-sm w-24"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(player);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(player)}
                          className="text-sm text-accent hover:underline"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-sm text-text-muted hover:underline"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <span
                        className="font-medium cursor-pointer hover:text-accent transition-colors"
                        onClick={() => startEdit(player)}
                        title="点击修改昵称"
                      >
                        {player.nickname}
                      </span>
                    )}
                    <div className="text-text-muted text-sm">@{player.username}</div>
                    <div className="text-text-muted text-xs">登录：用户名 + 初始密码 123456{player.mustChangePwd ? " · 待改密" : ""}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-medium text-text-primary">
                      {player.status === "ACTIVE" ? "正常" : "禁用"}
                    </span>
                  </td>
                  <td className="num py-3 px-4 text-right font-bold text-accent">{player.balance.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right text-text-secondary">{player.totalBets}</td>
                  <td className="py-3 px-4 text-right text-text-secondary">{player.totalBetAmount}</td>
                  <td className="py-3 px-4 text-right text-text-secondary">{player.totalWonBets}</td>
                  <td className="py-3 px-4 text-right text-text-secondary">{player.totalWinAmount}</td>
                  <td className={`py-3 px-4 text-right font-medium ${player.netProfit >= 0 ? "text-accent" : "text-red"}`}>
                    {player.netProfit >= 0 ? "+" : ""}{player.netProfit}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(player)}
                        className="text-sm px-2.5 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        改名
                      </button>
                      <button
                        onClick={() => updateBalance(player)}
                        className="text-sm px-2.5 py-1 rounded bg-gold/10 text-gold-dim hover:bg-gold/20 transition-colors"
                      >
                        改余额
                      </button>
                      <button
                        onClick={() => resetPassword(player)}
                        className="text-sm px-2.5 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        重置密码
                      </button>
                      <button
                        onClick={() => toggleStatus(player)}
                        className={`text-sm px-2.5 py-1 rounded transition-colors ${
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
    </div>
  );
}
