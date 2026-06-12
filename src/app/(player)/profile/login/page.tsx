"use client";

import { useState } from "react";

export default function PlayerLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/player-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("player_token", data.data.token);
        window.location.href = data.data.mustChangePwd ? "/profile/change-password" : "/profile";
      } else {
        alert(data.error || "登录失败");
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
          <div className="mb-2 text-3xl">👤</div>
          <h1 className="text-xl font-black text-text-primary">登录</h1>
          <p className="mt-1 text-xs text-text-muted">使用管理员创建的用户名登录</p>
        </div>
        <div className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            className="input-field w-full rounded-xl px-4 py-3 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="input-field w-full rounded-xl px-4 py-3 text-sm"
          />
          <button disabled={loading || !username.trim() || !password} className="btn-primary w-full rounded-xl py-3 text-sm disabled:opacity-40">
            {loading ? "登录中..." : "登录"}
          </button>
        </div>
      </form>
    </div>
  );
}
