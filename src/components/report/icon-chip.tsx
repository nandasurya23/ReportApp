"use client";

import { ReactNode } from "react";

interface IconChipProps {
  children: ReactNode;
  tone?: "cyan" | "slate" | "rose" | "emerald" | "amber";
  className?: string;
}

const toneClasses: Record<NonNullable<IconChipProps["tone"]>, string> = {
  cyan: "border-[#e7ddd1] bg-[#f8f1e8] text-[#6d5d50]",
  slate: "border-[#e7ddd1] bg-[#fbf8f4] text-[#5b4f44]",
  rose: "border-[#ead4ce] bg-[#fff5f2] text-[#a35f52]",
  emerald: "border-[#d8dccf] bg-[#f4f6ef] text-[#6f7a62]",
  amber: "border-[#e8d8bf] bg-[#fff6e8] text-[#9b7a45]",
};

export function IconChip({ children, tone = "cyan", className = "" }: IconChipProps) {
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border shadow-[0_8px_18px_-16px_rgba(15,23,42,0.35)] ring-1 ring-white/70 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
