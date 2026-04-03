"use client";

import { ReactNode } from "react";

interface PickerSurfaceProps {
  badgeText?: string;
  controlIcon?: ReactNode;
  helperText: string;
  controlId?: string;
  label: string;
  selectedLabel: string;
  children: ReactNode;
}

export function PickerSurface({
  badgeText = "Pilih Tanggal",
  controlIcon,
  helperText,
  controlId,
  label,
  selectedLabel,
  children,
}: PickerSurfaceProps) {
  return (
    <div className="rounded-2xl bg-transparent p-0">
      <label
        htmlFor={controlId}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7764]"
      >
        {label}
      </label>
      {children}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#6d5d50]">
        <span className="font-semibold text-[#5b4f44]">{selectedLabel}</span>
        <span>•</span>
        <p>{helperText}</p>
      </div>
    </div>
  );
}
