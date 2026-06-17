"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type NavItem = {
  href: string;
  label: string;
  icon: (props: { active: boolean }) => ReactNode;
};

type MobileNavContextValue = {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const value = useMemo(() => ({ drawerOpen, setDrawerOpen }), [drawerOpen]);

  return (
    <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used within MobileNavProvider");
  return ctx;
}

export function AdminMobileTopBar({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  const { setDrawerOpen } = useMobileNav();
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-30 glass border-b border-border">
      <div className="h-14 flex items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开菜单"
          className="-ml-1 p-2 -my-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <h1 className="flex-1 font-display text-base font-semibold truncate">{title}</h1>
        {right ? <div className="flex items-center gap-1">{right}</div> : null}
      </div>
    </div>
  );
}

export function MobileDrawer({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const { drawerOpen, setDrawerOpen } = useMobileNav();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, setDrawerOpen]);

  const close = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);

  if (!drawerOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 modal-overlay animate-fade-in"
        onClick={close}
      />
      <div className="absolute left-0 top-0 bottom-0 w-[82%] max-w-xs bg-bg-primary flex flex-col animate-slide-in-left">
        <div className="h-14 flex items-center justify-between px-4 bg-gradient-to-r from-accent to-accent-dim text-white">
          <h2 className="font-display text-base font-semibold">
            <span className="opacity-80">嗨</span>起来 · 管理后台
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="关闭菜单"
            className="p-2 -my-2 -mr-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                }`}
              >
                <span className={active ? "text-accent" : "text-text-muted"}>
                  <Icon active={active} />
                </span>
                <span className="flex-1">{item.label}</span>
                {active ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href="/"
            onClick={close}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            返回玩家端
          </Link>
        </div>
      </div>
    </div>
  );
}
