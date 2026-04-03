"use client";

import { memo } from "react";
import { FileSpreadsheet, FileText, Printer, RotateCcw } from "lucide-react";

import { IconChip } from "@/components/report/icon-chip";
import { Spinner } from "@/components/ui/spinner";
import { CustomMonthPicker } from "@/components/report/custom-month-picker";

interface ReportControlsProps {
  selectedMonth: string;
  onSelectedMonthChange: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  visibleCount: number;
  totalCount: number;
  onResetAll: () => void;
  onPrint: () => void;
  onSavePdf: () => void;
  onDownloadXLSX: () => void;
  isSavingPdf: boolean;
  isExportingXlsx: boolean;
  loadedCount: number;
  totalAvailable: number;
  hasMoreTransactions: boolean;
  onLoadMoreTransactions: () => void;
  isLoadingMoreTransactions: boolean;
  isMonthLoading: boolean;
  canExport: boolean;
  transactionError: string;
}

function ReportControlsComponent({
  selectedMonth,
  onSelectedMonthChange,
  searchQuery,
  setSearchQuery,
  visibleCount,
  totalCount,
  onResetAll,
  onPrint,
  onSavePdf,
  onDownloadXLSX,
  isSavingPdf,
  isExportingXlsx,
  loadedCount,
  totalAvailable,
  hasMoreTransactions,
  onLoadMoreTransactions,
  isLoadingMoreTransactions,
  isMonthLoading,
  canExport,
  transactionError,
}: ReportControlsProps) {
  return (
    <div className="no-print rounded-2xl border border-[#e7ddd1]/80 bg-[#fbf8f4]/90 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7764]">
            Report Controls
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#2f2a25] sm:text-[1.35rem]">
            Tabel Transaksi
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[#6d5d50]">
            Pilih bulan untuk memuat data aktif, lalu export atau cetak dari bulan itu.
          </p>
        </div>
        <div className="w-full lg:w-auto lg:min-w-105">
          <CustomMonthPicker
            id="month-filter"
            label="Bulan Aktif"
            value={selectedMonth}
            onChange={onSelectedMonthChange}
          />
        </div>
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-2xl border border-[#e7ddd1]/80 bg-[#f8f1e8]/70 p-3 sm:p-4">
          <label
            htmlFor="table-search"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7764]"
          >
            Quick Search
          </label>
          <input
            id="table-search"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari tanggal, kamar, client, qty, harga..."
            className="input-field w-full bg-[#fbf8f4]"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-[#e7ddd1] bg-[#fbf8f4] px-2.5 py-1 font-medium text-[#5b4f44]">
              {visibleCount} tampil
            </span>
            <span className="rounded-full border border-[#e7ddd1] bg-[#f8f1e8] px-2.5 py-1 font-medium text-[#6d5d50]">
              {totalCount} total
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-[#e7ddd1]/80 bg-[#fbf8f4] p-3 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7764]">
            Actions
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
            <button
              type="button"
              onClick={onResetAll}
              className="btn flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-[#fff5f2] px-3 py-2 text-sm font-medium text-rose-700 hover:bg-[#ffece5]"
            >
              <IconChip tone="rose" className="h-7 w-7 border-rose-200 bg-[#fbf8f4]/80 text-rose-700">
                <RotateCcw className="size-[15px]" strokeWidth={2.5} />
              </IconChip>
              Reset
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="btn flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7ddd1] bg-[#fbf8f4] px-3 py-2 text-sm font-medium text-[#5b4f44] hover:bg-[#f8f1e8]"
            >
              <IconChip tone="slate" className="h-7 w-7 border-[#e7ddd1] bg-[#f8f1e8] text-[#6d5d50]">
                <Printer className="size-[15px]" strokeWidth={2.5} />
              </IconChip>
              Print
            </button>
            <button
              type="button"
              onClick={onSavePdf}
              disabled={isSavingPdf || !canExport}
              className="btn flex w-full items-center justify-center gap-2 rounded-xl border border-[#6d5d50]/20 bg-[#3a332d] px-3 py-2 text-sm font-medium text-[#fbf8f4] hover:bg-[#4a4239] disabled:opacity-60"
            >
              {isSavingPdf && <Spinner size="sm" className="border-slate-200 border-t-white" />}
              <IconChip tone="slate" className="h-7 w-7 border-white/10 bg-white/10 text-[#f7f1e8]">
                <FileText className="size-[15px]" strokeWidth={2.5} />
              </IconChip>
              {isSavingPdf ? "Menyiapkan PDF..." : "PDF"}
            </button>
            <button
              type="button"
              onClick={onDownloadXLSX}
              disabled={isExportingXlsx || !canExport}
              className="btn flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7ddd1] bg-[#f8f1e8] px-3 py-2 text-sm font-medium text-[#5b4f44] hover:bg-[#efe4d6] disabled:opacity-60"
            >
              {isExportingXlsx && <Spinner size="sm" className="border-slate-200 border-t-slate-700" />}
              <IconChip tone="slate" className="h-7 w-7 border-[#e7ddd1] bg-[#fbf8f4] text-[#6d5d50]">
                <FileSpreadsheet className="size-[15px]" strokeWidth={2.5} />
              </IconChip>
              {isExportingXlsx ? "Menyiapkan XLSX..." : "XLSX"}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-600">
          Menampilkan {loadedCount} dari {totalAvailable} baris bulan aktif
        </p>
        {hasMoreTransactions && (
          <button
            type="button"
            onClick={onLoadMoreTransactions}
            disabled={isLoadingMoreTransactions || isMonthLoading}
            className="btn inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7ddd1] bg-[#fbf8f4] px-3 py-2 text-sm font-medium text-[#5b4f44] hover:bg-[#f8f1e8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isLoadingMoreTransactions && <Spinner size="sm" />}
            {isLoadingMoreTransactions ? "Memuat..." : "Muat baris berikutnya"}
          </button>
        )}
      </div>
      {isMonthLoading && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e7ddd1] bg-[#fbf8f4] px-3 py-2 text-xs text-[#6d5d50]">
          <Spinner size="sm" />
          Memuat bulan aktif...
        </div>
      )}
      {transactionError && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-[#fff5f2] px-3 py-2 text-sm text-rose-700">
          {transactionError}
        </p>
      )}
    </div>
  );
}

export const ReportControls = memo(ReportControlsComponent);
