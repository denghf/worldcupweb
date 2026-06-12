"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return alert("密码至少 6 位");
    if (password !== confirm) return alert("两次密码不一致");
    const token = localStorage.getItem("player_token");
    if (!token) return router.replace("/profile/login");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await res.json();
      if (data.success) {
        alert("密码设置成功");
        router.replace("/profile");
      } else {
        alert(data.error || "修改失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl">🔐</div>
          <h1 className="text-xl font-black text-text-primary">设置新密码</h1>
          <p className="mt-1 text-xs text-text-muted">首次登录需要修改初始密码</p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="新密码（至少 6 位）"
            className="input-field w-full rounded-xl px-4 py-3 text-sm"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="再次输入新密码"
            className="input-field w-full rounded-xl px-4 py-3 text-sm"
          />
          <button disabled={loading || !password || !confirm} className="btn-primary w-full rounded-xl py-3 text-sm disabled:opacity-40">
            {loading ? "保存中..." : "保存密码"}
          </button>
        </div>
      </form>
    </div>
  );
}
