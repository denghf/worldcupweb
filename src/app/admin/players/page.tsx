"use client";

import { useEffect, useState } from "react";
import { AdminMobileTopBar } from "@/components/admin/mobile-nav";
import { Sheet } from "@/components/admin/sheet";

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

type ActionKind = "rename" | "balance" | "password" | null;

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Add (Sheet)
  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");

  // Inline rename (desktop)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNickname, setEditNickname] = useState("");

  // Mobile action flow
  const [actionTarget, setActionTarget] = useState<Player | null>(null);
  const [actionKind, setActionKind] = useState<ActionKind>(null);
  const [renameValue, setRenameValue] = useState("");
  const [balanceValue, setBalanceValue] = useState("");

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

  const openAction = (player: Player, kind: ActionKind) => {
    setActionTarget(player);
    setActionKind(kind);
    if (kind === "rename") setRenameValue(player.nickname);
    if (kind === "balance") setBalanceValue(String(player.balance));
  };

  const closeAction = () => {
    setActionKind(null);
    setActionTarget(null);
    setRenameValue("");
    setBalanceValue("");
  };

  const submitRename = async () => {
    if (!actionTarget || !renameValue.trim()) return;
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: actionTarget.id, nickname: renameValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        closeAction();
        loadPlayers();
      } else {
        alert(data.error || "修改失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  const submitBalance = async () => {
    if (!actionTarget) return;
    const balance = Number(balanceValue);
    if (!Number.isFinite(balance) || balance < 0) return alert("请输入不小于 0 的数字");
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: actionTarget.id, balance }),
      });
      const data = await res.json();
      if (data.success) {
        closeAction();
        loadPlayers();
      } else {
        alert(data.error || "修改失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  const submitResetPassword = async () => {
    if (!actionTarget) return;
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: actionTarget.id, resetPassword: true }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.data.message);
        closeAction();
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
      <AdminMobileTopBar
        title="玩家管理"
        right={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            aria-label="添加玩家"
            className="p-2 -my-2 rounded-lg text-accent hover:bg-accent/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
      />

      {/* Header (desktop) */}
      <div className="hidden md:flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">玩家管理</h2>
          <p className="text-text-muted text-sm mt-1">管理参与下注的玩家</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-sm">{players.length} 位玩家</span>
          <button onClick={() => setShowAdd(true)} className="btn-primary px-3 py-1.5 rounded-lg text-sm">
            + 添加玩家
          </button>
        </div>
      </div>

      {/* Mobile count */}
      <div className="md:hidden text-text-muted text-xs mb-3 -mt-1">
        共 {players.length} 位玩家 · 点击卡片管理
      </div>

      {/* Add sheet (mobile + desktop) */}
      <Sheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="添加玩家"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="btn-ghost px-4 py-2 rounded-lg text-sm"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!username || !nickname}
              className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-40"
            >
              确认添加
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">用户名</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="如 xiaoming"
              className="input-field w-full rounded-lg px-3 py-2.5 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">昵称</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="如 小明"
              className="input-field w-full rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <p className="text-text-muted text-xs">初始密码 123456，玩家首次登录需修改</p>
        </div>
      </Sheet>

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block glass rounded-xl overflow-x-auto">
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
                    <td className={`py-3 px-4 text-right font-medium ${player.netProfit > 0 ? "text-accent" : player.netProfit < 0 ? "text-emerald-500" : ""}`}>
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

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} onOpen={() => setActionTarget(player)} />
            ))}
          </div>
        </>
      )}

      {/* Action chooser sheet */}
      <Sheet open={!!actionTarget && !actionKind} onClose={closeAction} title={actionTarget?.nickname} size="sm">
        {actionTarget ? (
          <div className="space-y-1.5">
            <ActionButton
              label="修改昵称"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                </svg>
              }
              onClick={() => actionTarget && openAction(actionTarget, "rename")}
            />
            <ActionButton
              label="修改下注余额"
              hint={`当前 ${actionTarget.balance.toFixed(1)}`}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
              onClick={() => actionTarget && openAction(actionTarget, "balance")}
            />
            <ActionButton
              label="重置密码"
              hint="重置为 123456"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
              onClick={() => actionTarget && openAction(actionTarget, "password")}
            />
            <ActionButton
              label={actionTarget.status === "ACTIVE" ? "禁用账号" : "启用账号"}
              danger={actionTarget.status === "ACTIVE"}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M4.93 4.93l14.14 14.14" />
                </svg>
              }
              onClick={() => {
                const t = actionTarget;
                closeAction();
                if (t) toggleStatus(t);
              }}
            />
          </div>
        ) : null}
      </Sheet>

      {/* Rename sheet */}
      <Sheet
        open={actionKind === "rename"}
        onClose={closeAction}
        title="修改昵称"
        size="sm"
        footer={
          <>
            <button type="button" onClick={closeAction} className="btn-ghost px-4 py-2 rounded-lg text-sm">取消</button>
            <button type="button" onClick={submitRename} className="btn-primary px-4 py-2 rounded-lg text-sm">保存</button>
          </>
        }
      >
        <label className="text-sm text-text-secondary mb-1 block">新昵称</label>
        <input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          className="input-field w-full rounded-lg px-3 py-2.5 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRename();
          }}
        />
      </Sheet>

      {/* Balance sheet */}
      <Sheet
        open={actionKind === "balance"}
        onClose={closeAction}
        title="修改下注余额"
        size="sm"
        footer={
          <>
            <button type="button" onClick={closeAction} className="btn-ghost px-4 py-2 rounded-lg text-sm">取消</button>
            <button type="button" onClick={submitBalance} className="btn-primary px-4 py-2 rounded-lg text-sm">保存</button>
          </>
        }
      >
        <label className="text-sm text-text-secondary mb-1 block">下注余额</label>
        <input
          value={balanceValue}
          onChange={(e) => setBalanceValue(e.target.value)}
          inputMode="decimal"
          className="input-field w-full rounded-lg px-3 py-2.5 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") submitBalance();
          }}
        />
        {actionTarget ? (
          <p className="text-text-muted text-xs mt-2">当前余额 {actionTarget.balance.toFixed(1)}</p>
        ) : null}
      </Sheet>

      {/* Password confirm sheet */}
      <Sheet
        open={actionKind === "password"}
        onClose={closeAction}
        title="重置密码"
        size="sm"
        footer={
          <>
            <button type="button" onClick={closeAction} className="btn-ghost px-4 py-2 rounded-lg text-sm">取消</button>
            <button type="button" onClick={submitResetPassword} className="btn-primary px-4 py-2 rounded-lg text-sm">确认重置</button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          密码将重置为 <span className="font-mono font-semibold text-text-primary">123456</span>，
          玩家下次登录需重新设置密码。
        </p>
      </Sheet>
    </div>
  );
}

function PlayerCard({ player, onOpen }: { player: Player; onOpen: () => void }) {
  const profitPositive = player.netProfit > 0;
  const profitNegative = player.netProfit < 0;
  const disabled = player.status !== "ACTIVE";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left glass rounded-xl p-3.5 active:scale-[0.99] transition-transform animate-fade-in-up"
    >
      <div className="flex items-center gap-3">
        <Avatar nickname={player.nickname} disabled={disabled} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary truncate">{player.nickname}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                disabled ? "bg-bg-elevated text-text-muted" : "bg-accent/10 text-accent"
              }`}
            >
              {disabled ? "禁用" : "正常"}
            </span>
          </div>
          <div className="text-text-muted text-xs">@{player.username}</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted shrink-0">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        <MiniStat label="余额" value={player.balance.toFixed(0)} accent />
        <MiniStat label="下注" value={String(player.totalBets)} />
        <MiniStat label="中奖" value={String(player.totalWonBets)} />
        <MiniStat
          label="盈亏"
          value={`${player.netProfit >= 0 ? "+" : ""}${player.netProfit}`}
          tone={profitPositive ? "accent" : profitNegative ? "green" : "default"}
        />
      </div>
    </button>
  );
}

function Avatar({ nickname, disabled }: { nickname: string; disabled: boolean }) {
  const initial = nickname.trim().slice(0, 1) || "?";
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-white shrink-0 ${
        disabled
          ? "bg-bg-elevated text-text-muted"
          : "bg-gradient-to-br from-accent to-accent-dim shadow-md"
      }`}
    >
      {initial}
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
  tone = "default",
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "default" | "accent" | "green";
}) {
  const color =
    tone === "accent" || accent ? "text-accent" : tone === "green" ? "text-emerald-500" : "text-text-primary";
  return (
    <div className="rounded-lg bg-bg-surface px-2 py-1.5 text-center">
      <div className="text-[10px] text-text-muted">{label}</div>
      <div className={`text-sm font-semibold ${color} num`}>{value}</div>
    </div>
  );
}

function ActionButton({
  label,
  hint,
  icon,
  onClick,
  danger,
}: {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
        danger ? "text-red hover:bg-red/5" : "text-text-primary hover:bg-bg-elevated"
      }`}
    >
      <span className={danger ? "text-red" : "text-text-secondary"}>{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint ? <div className="text-xs text-text-muted mt-0.5">{hint}</div> : null}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}
