"use client";

import React from "react";

type BadgeTone = "emerald" | "amber" | "blue" | "slate";

interface ModuleHeaderProps {
  title: string;
  subtitle: string;
  badge?: {
    text: string;
    tone?: BadgeTone;
    pulse?: boolean;
  };
  extraBadges?: React.ReactNode;
  actions?: React.ReactNode;
}

const BADGE_STYLES: Record<BadgeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  amber: "bg-amber-50 text-amber-700 border-amber-200/70",
  blue: "bg-blue-50 text-blue-700 border-blue-200/70",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

const DOT_STYLES: Record<BadgeTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  slate: "bg-slate-500",
};

export default function ModuleHeader({
  title,
  subtitle,
  badge,
  extraBadges,
  actions,
}: ModuleHeaderProps) {
  const tone = badge?.tone || "blue";

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${BADGE_STYLES[tone]}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${DOT_STYLES[tone]} ${
                  badge.pulse ? "animate-pulse" : ""
                }`}
              />
              {badge.text}
            </span>
          )}
          {extraBadges}
        </div>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
