"use client";

import { motion } from "framer-motion";

import { formatIDR } from "@/lib/utils/currency";
import { formatDateWITA } from "@/lib/utils/date";

interface ReportSummaryProps {
  monthlyTotal: number;
  reportClientName: string;
  printKeterangan: string;
  username: string;
  selectedMonthLabel: string;
  isMonthLoading: boolean;
  hasMonthError: boolean;
  monthErrorMessage: string;
}

export function ReportSummary({
  monthlyTotal,
  reportClientName,
  printKeterangan,
  username,
  selectedMonthLabel,
  isMonthLoading,
  hasMonthError,
  monthErrorMessage,
}: ReportSummaryProps) {
  return (
    <motion.section
      layout
      className="no-print mt-5 rounded-2xl border border-[#e7ddd1]/80 bg-[#fbf8f4]/90 p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7764]">
            Monthly summary
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#2f2a25]">
            Ringkasan Laporan
          </h3>
          <p className="mt-1 text-sm text-[#6d5d50]">
            Informasi pendukung untuk laporan bulan aktif dan output export.
          </p>
        </div>
        <div className="rounded-2xl border border-[#e7ddd1] bg-[#f8f1e8] px-4 py-3 text-left md:min-w-72 md:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7764]">
            Total Bulanan
          </p>
          {isMonthLoading ? (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-[#6d5d50]">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#d8ccbc] border-t-[#5b4f44]" />
              Memuat...
            </div>
          ) : hasMonthError ? (
            <div className="mt-2 text-sm text-rose-600">Bulan ini gagal dimuat.</div>
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[#2f2a25]">
              {formatIDR(monthlyTotal)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-[#5b4f44] sm:grid-cols-2">
        <div className="rounded-2xl border border-[#e7ddd1] bg-[#f8f1e8] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7764]">
            Detail Laporan
          </p>
          <div className="mt-2 space-y-1">
            <p>Bulan Aktif: {selectedMonthLabel}</p>
            {hasMonthError && <p className="text-rose-600">{monthErrorMessage}</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e7ddd1] bg-[#fbf8f4] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7764]">
            Output Print
          </p>
          <div className="mt-2 space-y-1">
            <p>Nama Client: {reportClientName.trim() || "-"}</p>
            <p>Keterangan: {printKeterangan}</p>
            <p>TTD Pemilik Laundry: {username}</p>
            <p>Tanggal (WITA): {formatDateWITA()}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
