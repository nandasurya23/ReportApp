"use client";

import { memo } from "react";
import {
  FiDownload,
  FiFileText,
  FiGrid,
  FiPrinter,
  FiRefreshCw,
} from "react-icons/fi";

import { CustomDatePicker } from "@/components/report/custom-date-picker";
import { Spinner } from "@/components/ui/spinner";

interface ReportControlsProps {
  startDate: string;
  endDate: string;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  visibleCount: number;
  totalCount: number;
  onResetAll: () => void;
  onPrint: () => void;
  onSavePdf: () => void;
  onDownloadCSV: () => void;
  onDownloadXLSX: () => void;
  isSavingPdf: boolean;
  isExportingXlsx: boolean;
  isLoadingTransactions: boolean;
  transactionError: string;
}

function ReportControlsComponent({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  searchQuery,
  setSearchQuery,
  visibleCount,
  totalCount,
  onResetAll,
  onPrint,
  onSavePdf,
  onDownloadCSV,
  onDownloadXLSX,
  isSavingPdf,
  isExportingXlsx,
  isLoadingTransactions,
  transactionError,
}: ReportControlsProps) {
  return (
    <div className="no-print rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Report Controls
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
            Tabel Transaksi Harian
          </h2>
          <p className="mt-1 text-xs text-slate-500">Filter berdasarkan rentang tanggal.</p>
        </div>
        <div className="grid w-full gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]">
          <CustomDatePicker
            id="start-date-filter"
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
          />
          <CustomDatePicker
            id="end-date-filter"
            label="End Date"
            value={endDate}
            onChange={setEndDate}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-end">
        <div className="grow">
          <label
            htmlFor="table-search"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
          >
            Quick Search
          </label>
          <input
            id="table-search"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari tanggal, kamar, client, qty, harga..."
            className="input-field w-full"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <span className="rounded-full bg-cyan-100 px-2.5 py-1 font-medium text-cyan-700">
            {visibleCount} tampil
          </span>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 font-medium text-slate-700">
            {totalCount} total
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        <button
          type="button"
          onClick={onResetAll}
          className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          <FiRefreshCw />
          Reset Semua
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600"
        >
          <FiPrinter />
          Print
        </button>
        <button
          type="button"
          onClick={onSavePdf}
          disabled={isSavingPdf}
          className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-60"
        >
          {isSavingPdf && <Spinner size="sm" className="border-slate-200 border-t-white" />}
          <FiFileText />
          {isSavingPdf ? "Saving..." : "Save PDF"}
        </button>
        <button
          type="button"
          onClick={onDownloadCSV}
          className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          <FiDownload />
          Download CSV
        </button>
        <button
          type="button"
          onClick={onDownloadXLSX}
          disabled={isExportingXlsx}
          className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-60"
        >
          {isExportingXlsx && <Spinner size="sm" className="border-slate-200 border-t-white" />}
          <FiGrid />
          {isExportingXlsx ? "Exporting..." : "Download XLSX"}
        </button>
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        Actions
      </p>
      {isLoadingTransactions && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          <Spinner size="sm" />
          Memuat transaksi dari server...
        </div>
      )}
      {transactionError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {transactionError}
        </p>
      )}
    </div>
  );
}

export const ReportControls = memo(ReportControlsComponent);
