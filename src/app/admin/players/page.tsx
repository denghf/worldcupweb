"use client";

import { useState, useEffect } from "react";

interface Player {
  id: number;
  username: string;
  nickname: string;
  status: string;
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
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch("/api/admin/players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        loadPlayers();
      } else {
        alert(data.error || "删除失败");
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
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-sm">
                <th className="text-left py-3 px-4 font-medium">玩家</th>
                <th className="text-center py-3 px-4 font-medium">状态</th>
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
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-medium text-text-primary">
                      {player.status === "ACTIVE" ? "正常" : "禁用"}
                    </span>
                  </td>
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
                        onClick={() => toggleStatus(player)}
                        className={`text-sm px-2.5 py-1 rounded transition-colors ${
                          player.status === "ACTIVE"
                            ? "bg-red/10 text-red hover:bg-red/20"
                            : "bg-accent/10 text-accent hover:bg-accent/20"
                        }`}
                      >
                        {player.status === "ACTIVE" ? "禁用" : "启用"}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(player)}
                        className="text-sm px-2.5 py-1 rounded bg-red/10 text-red hover:bg-red/20 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4">
          <div className="bg-bg-surface w-full max-w-sm rounded-2xl p-6 animate-fade-in-up">
            <h3 className="font-display text-base font-semibold mb-2">确认删除</h3>
            <p className="text-text-secondary text-sm mb-1">
              确定要删除玩家 <span className="text-text-primary font-medium">{deleteTarget.nickname}</span>
              <span className="text-text-muted"> (@{deleteTarget.username})</span> 吗？
            </p>
            <p className="text-red text-sm mb-5">此操作不可撤销，该玩家的所有下注和交易记录将被永久删除。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-border hover:bg-bg-hover transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm bg-red text-white hover:opacity-90 transition-opacity font-semibold"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
