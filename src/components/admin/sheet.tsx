"use client";

import { useEffect, type ReactNode } from "react";

type Size = "sm" | "md" | "lg";

const sizeMaxWidth: Record<Size, string> = {
  sm: "md:max-w-md",
  md: "md:max-w-xl",
  lg: "md:max-w-3xl",
};

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: Size;
}) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex md:items-center md:justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 modal-overlay animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative mt-auto md:mt-0 w-full ${sizeMaxWidth[size]} bg-bg-primary md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[88vh] md:max-h-[85vh] animate-slide-up md:animate-fade-in-up`}
      >
        <div className="md:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-border/60" />
        {title ? (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h3 className="font-display text-lg font-semibold truncate">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="p-1.5 -mr-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
