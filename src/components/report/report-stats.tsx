"use client";

import { FiFileText, FiList, FiUsers } from "react-icons/fi";

import { formatIDR } from "@/lib/utils/currency";

interface ReportStatsProps {
  monthlyTotal: number;
  activeTransactionCount: number;
  activeClientCount: number;
}

export function ReportStats({
  monthlyTotal,
  activeTransactionCount,
  activeClientCount,
}: ReportStatsProps) {
  return (
    <section className="no-print rounded-2xl border border-slate-200/80 bg-white/65 p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        <article className="surface-card p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-700">
            <FiFileText className="text-sm" />
            Total Bulanan
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatIDR(monthlyTotal)}</p>
          <p className="mt-1 text-xs text-slate-500">Akumulasi transaksi pada periode aktif.</p>
        </article>
        <article className="surface-card p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-700">
            <FiList className="text-sm" />
            Transaksi Aktif
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{activeTransactionCount}</p>
          <p className="mt-1 text-xs text-slate-500">Jumlah baris transaksi bulan ini.</p>
        </article>
        <article className="surface-card p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-700">
            <FiUsers className="text-sm" />
            Client Aktif
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{activeClientCount}</p>
          <p className="mt-1 text-xs text-slate-500">Client yang dipakai untuk laporan aktif.</p>
        </article>
      </div>
    </section>
  );
}
