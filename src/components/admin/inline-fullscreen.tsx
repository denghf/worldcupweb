"use client";

import { useEffect, type ReactNode } from "react";

export function InlineFullscreen({
  open,
  onClose,
  title,
  onSave,
  children,
  saveLabel = "保存",
  saveDisabled,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  onSave?: () => void;
  children: ReactNode;
  saveLabel?: string;
  saveDisabled?: boolean;
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
      className="fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4 bg-bg-deep md:bg-transparent"
      role="dialog"
      aria-modal="true"
    >
      <div className="hidden md:block absolute inset-0 modal-overlay animate-fade-in" onClick={onClose} />
      <div className="relative h-full md:h-auto md:max-h-[86vh] md:w-full md:max-w-[900px] md:rounded-2xl md:bg-bg-surface md:shadow-2xl flex flex-col overflow-hidden">
        <div className="h-14 flex items-center gap-2 px-3 glass border-b border-border">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回"
            className="p-2 -my-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="flex-1 font-display text-base font-semibold truncate text-center">
            {title}
          </h3>
          {onSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled}
              className="btn-primary px-4 py-1.5 rounded-lg text-xs disabled:opacity-50"
            >
              {saveLabel}
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
