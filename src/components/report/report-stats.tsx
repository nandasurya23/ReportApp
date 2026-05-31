"use client";

import { memo } from "react";
import { ListOrdered, ReceiptText, Users } from "lucide-react";

import { IconChip } from "@/components/report/icon-chip";
import { formatIDR } from "@/lib/utils/currency";

interface ReportStatsProps {
  monthlyTotal: number | null;
  activeTransactionCount: number | null;
  activeClientCount: number;
  selectedMonthLabel: string;
  isMonthLoading: boolean;
  hasMonthError: boolean;
  monthErrorMessage: string;
}

function ReportStatsComponent({
  monthlyTotal,
  activeTransactionCount,
  activeClientCount,
  selectedMonthLabel,
  isMonthLoading,
  hasMonthError,
  monthErrorMessage,
}: ReportStatsProps) {
  return (
    <section className="no-print rounded-2xl border border-[#e7ddd1]/80 bg-[#fbf8f4]/90 p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between rounded-xl border border-[#e7ddd1] bg-[#f8f1e8] px-3 py-2 text-xs font-medium text-[#6d5d50]">
        <span>Ringkasan bulan aktif</span>
        <span>{selectedMonthLabel}</span>
      </div>
      {hasMonthError && (
        <div className="mb-3 rounded-xl border border-rose-200 bg-[#fff5f2] px-3 py-2 text-xs text-rose-700">
          <p className="font-semibold">Gagal memuat bulan aktif</p>
          <p className="mt-0.5">{monthErrorMessage}</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-[#6d5d50]/20 bg-[#3a332d] px-4 py-4 text-[#fbf8f4] shadow-[0_12px_28px_-22px_rgba(47,42,37,0.32)]">
          <div className="flex items-center gap-3">
            <IconChip tone="slate" className="border-white/10 bg-white/10 text-[#f7f1e8]">
              <ReceiptText className="size-4" strokeWidth={2.4} />
            </IconChip>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e8dcca]">
                Total Bulanan
              </p>
            </div>
          </div>
          {isMonthLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-[#e8dcca]">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#8a7764] border-t-[#f7f1e8]" />
              Memuat...
            </div>
          ) : hasMonthError ? (
            <div className="mt-3 text-sm text-rose-200">Bulan ini gagal dimuat.</div>
          ) : (
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#fbf8f4]">
              {formatIDR(monthlyTotal ?? 0)}
            </p>
          )}
          <p className="mt-2 text-xs text-[#e8dcca]">Akumulasi transaksi bulan ini.</p>
        </article>
        <article className="surface-card p-4 bg-[#fbf8f4]/94 border-[#e7ddd1]">
          <div className="flex items-center gap-3">
            <IconChip tone="slate">
              <ListOrdered className="size-4" strokeWidth={2.4} />
            </IconChip>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7764]">
                Transaksi Aktif
              </p>
            </div>
          </div>
          {isMonthLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-[#6d5d50]">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#d8ccbc] border-t-[#6d5d50]" />
              Memuat...
            </div>
          ) : hasMonthError ? (
            <div className="mt-3 text-sm text-rose-600">Bulan ini gagal dimuat.</div>
          ) : (
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#2f2a25]">
              {activeTransactionCount ?? 0}
            </p>
          )}
          <p className="mt-2 text-xs text-[#6d5d50]">Jumlah baris transaksi bulan ini.</p>
        </article>
        <article className="surface-card p-4 bg-[#fbf8f4]/94 border-[#e7ddd1]">
          <div className="flex items-center gap-3">
            <IconChip tone="slate">
              <Users className="size-4" strokeWidth={2.4} />
            </IconChip>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7764]">
                Client Aktif
              </p>
            </div>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[#2f2a25]">{activeClientCount}</p>
          <p className="mt-2 text-xs text-[#6d5d50]">Client yang dipakai untuk laporan aktif.</p>
        </article>
      </div>
    </section>
  );
}

export const ReportStats = memo(ReportStatsComponent);
