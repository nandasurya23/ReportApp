"use client";

import { FiLogOut } from "react-icons/fi";

interface ReportTopbarProps {
  username: string;
  reportClientName: string;
  onLogout: () => void | Promise<void>;
}

export function ReportTopbar({ username, reportClientName, onLogout }: ReportTopbarProps) {
  return (
    <header className="surface-card no-print flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
          Laundry Dashboard
        </p>
        <h1 className="mt-0.5 text-xl font-semibold text-slate-900 sm:text-2xl">
          Monthly Report Center
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
            User: {username}
          </span>
          {reportClientName.trim() && (
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-medium text-cyan-700">
              Client: {reportClientName.trim()}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="btn flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:w-auto"
      >
        <FiLogOut className="text-base" />
        Keluar
      </button>
    </header>
  );
}
