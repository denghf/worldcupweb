"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "总览", icon: DashboardIcon },
  { href: "/admin/bets", label: "下注管理", icon: BetIcon },
  { href: "/admin/bet-details", label: "下注详情", icon: BetDetailIcon },
  { href: "/admin/players", label: "玩家管理", icon: UsersIcon },
  { href: "/admin/tournaments", label: "赛事管理", icon: TournamentIcon },
  { href: "/admin/results", label: "赛果查看", icon: ResultsIcon },
  { href: "/admin/redemptions", label: "兑奖管理", icon: RedemptionIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-bg-primary">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <h1 className="font-display text-base font-semibold">
            <span className="text-accent">嗨</span>起来
            <span className="text-text-muted text-xs ml-2 font-body">管理后台</span>
          </h1>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
              >
                <item.icon active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Link
            href="/"
            className="text-text-muted text-xs hover:text-accent transition-colors"
          >
            ← 返回玩家端
          </Link>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border">
        <div className="h-14 flex items-center justify-between px-4">
          <h1 className="font-display text-sm font-semibold">
            <span className="text-accent">嗨</span>起来 · 管理后台
          </h1>
          <Link href="/" className="text-text-muted text-xs">返回</Link>
        </div>
        <div className="flex overflow-x-auto gap-1 px-3 pb-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-text-secondary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:p-6 p-4 pt-28 md:pt-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function BetIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="m9 15 3-3 3 3" />
    </svg>
  );
}

function BetDetailIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" />
    </svg>
  );
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TournamentIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function RedemptionIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function StatsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2">
      <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
  );
}

function ResultsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}
