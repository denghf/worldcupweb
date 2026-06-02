"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            <span className="text-accent">嗨</span>起来
          </h1>
          <p className="text-text-muted text-sm">管理后台登录</p>
        </div>

        <form onSubmit={handleLogin} className="glass rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red/10 text-red text-xs px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field w-full rounded-lg px-3 py-2.5 text-sm"
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full rounded-lg px-3 py-2.5 text-sm"
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="btn-primary w-full py-2.5 rounded-lg text-sm disabled:opacity-40"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/" className="text-text-muted text-xs hover:text-accent transition-colors">
            ← 返回玩家端
          </Link>
        </div>
      </div>
    </div>
  );
}
