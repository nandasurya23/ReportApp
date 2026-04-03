"use client";

import { LogOut } from "lucide-react";

import { IconChip } from "@/components/report/icon-chip";

interface ReportTopbarProps {
  username: string;
  reportClientName: string;
  selectedMonthLabel: string;
  onLogout: () => void | Promise<void>;
}

export function ReportTopbar({
  username,
  reportClientName,
  selectedMonthLabel,
  onLogout,
}: ReportTopbarProps) {
  return (
    <header className="no-print flex flex-col gap-4 rounded-2xl border border-[#e7ddd1]/90 bg-[#fbf8f4]/95 p-4 shadow-sm backdrop-blur sm:p-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7764]">
            Laundry Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2f2a25] sm:text-[1.75rem]">
            Monthly Report Center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6d5d50]">
            Kelola transaksi, filter bulan, dan export laporan dari satu tempat yang tenang dan rapi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="rounded-full border border-[#e7ddd1] bg-[#f8f1e8] px-2.5 py-1 font-medium text-[#5b4f44]">
            Bulan aktif: {selectedMonthLabel}
          </span>
          <span className="rounded-full border border-[#e7ddd1] bg-[#fbf8f4] px-2.5 py-1 font-medium text-[#5b4f44]">
            User: {username}
          </span>
          {reportClientName.trim() && (
            <span className="rounded-full border border-[#e7ddd1] bg-[#f8f1e8] px-2.5 py-1 font-medium text-[#5b4f44]">
              Client: {reportClientName.trim()}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="btn flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7ddd1] bg-[#fbf8f4] px-4 py-2 text-sm font-medium text-[#5b4f44] hover:bg-[#f8f1e8] md:w-auto"
      >
        <IconChip tone="slate" className="h-8 w-8">
          <LogOut className="size-4" strokeWidth={2.5} />
        </IconChip>
        Keluar
      </button>
    </header>
  );
}
