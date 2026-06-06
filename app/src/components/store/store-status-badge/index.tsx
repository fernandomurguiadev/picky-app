"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { DaySchedule } from "@/lib/types/store";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface StoreStatusBadgeProps {
  isOpen: boolean;
  todaySchedule?: DaySchedule | null;
  className?: string;
}

export function StoreStatusBadge({ isOpen, todaySchedule, className }: StoreStatusBadgeProps) {
  const t = useTranslations("storeStatus");
  const [showSchedule, setShowSchedule] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSchedule(false);
      }
    }

    if (showSchedule) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSchedule]);

  const hasSchedule = todaySchedule && todaySchedule.shifts && todaySchedule.shifts.length > 0;
  const dayName = todaySchedule ? t(`days.${todaySchedule.day}`) : "";

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => {
          setShowSchedule(!showSchedule);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowSchedule(!showSchedule);
          }
          if (e.key === "Escape") {
            setShowSchedule(false);
          }
        }}
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-xs cursor-pointer select-none transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary)]",
          isOpen
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
            : "bg-[var(--store-accent)] text-[var(--store-accent-foreground)] hover:brightness-105",
          className
        )}
        aria-haspopup="dialog"
        aria-expanded={showSchedule}
        title={t("todaySchedule", { day: dayName || t("storeSchedule") })}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-transform duration-300",
            isOpen ? "bg-emerald-600 dark:bg-emerald-400 animate-pulse" : "bg-[var(--store-accent-foreground)]"
          )}
        />
        <span>{isOpen ? t("open") : t("closed")}</span>
      </button>

      {/* Popover */}
      {showSchedule && (
        <div
          className={cn(
            "absolute right-0 mt-2 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200/50 bg-white/95 p-4 text-zinc-950 shadow-xl backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/95 dark:text-zinc-50 transition-all duration-200 animate-in fade-in slide-in-from-top-2",
          )}
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5 dark:border-zinc-800/50">
            <Clock className="h-4 w-4 text-[var(--store-accent)]" />
            <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              {dayName ? t("todaySchedule", { day: dayName }) : t("storeSchedule")}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {!todaySchedule ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic font-medium">
                {t("noSchedule")}
              </p>
            ) : !todaySchedule.isOpen || !hasSchedule ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic font-medium">
                {t("closedToday")}
              </p>
            ) : (
              todaySchedule.shifts.map((shift, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-center rounded-lg bg-zinc-50/60 px-3 py-2.5 text-xs font-bold text-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-200"
                >
                  <span>
                    {shift.open} hs - {shift.close} hs
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
