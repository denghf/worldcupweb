"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "赛事", icon: MatchIcon },
  { href: "/bets", label: "投注", icon: BetsIcon },
  { href: "/ranking", label: "排名", icon: RankIcon },
  { href: "/profile", label: "我的", icon: UserIcon },
];

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMatchDetail = pathname.startsWith("/match/");

  return (
    <div className="min-h-[100dvh] bg-bg-deep text-text-primary">
      <main className={`mx-auto flex w-full max-w-md flex-col md:max-w-3xl ${isMatchDetail ? "min-h-[100dvh]" : "min-h-[100dvh] pb-20"}`}>
        {children}
      </main>
      {!isMatchDetail && <BottomNav />}
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around md:max-w-3xl">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-colors ${
                active ? "text-accent" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <tab.icon active={active} />
              <span className="text-[11px] font-semibold">{tab.label}</span>
              {active && <span className="absolute -bottom-1 h-0.5 w-5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MatchIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function BetsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="m9 15 3-3 3 3" />
    </svg>
  );
}

function RankIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9ZM18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9Z" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--color-accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
