"use client";

import { Dispatch, memo, SetStateAction } from "react";
import { motion } from "framer-motion";

import { EmptyState } from "@/components/report/empty-state";
import { ReportControls } from "@/components/report/report-controls";
import { ReportSummary } from "@/components/report/report-summary";
import { TransactionsTable } from "@/components/report/transactions-table";
import { Spinner } from "@/components/ui/spinner";
import { LaundryTransaction } from "@/types/laundry";

interface EditDraft {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: string;
  priceInput: string;
}

interface ReportTableSectionProps {
  selectedMonth: string;
  selectedMonthLabel: string;
  onSelectedMonthChange: (value: string) => void;
  isMonthLoading: boolean;
  isMonthReady: boolean;
  hasMonthError: boolean;
  monthErrorMessage: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  visibleTransactions: LaundryTransaction[];
  onResetAll: () => void;
  onPrint: () => void;
  onSavePdf: () => void | Promise<void>;
  onDownloadXLSX: () => void | Promise<void>;
  isSavingPdf: boolean;
  isExportingXlsx: boolean;
  loadedCount: number;
  totalAvailable: number;
  hasMoreTransactions: boolean;
  onLoadMoreTransactions: () => void | Promise<void>;
  isLoadingMoreTransactions: boolean;
  transactionError: string;
  finalReportTitle: string;
  visibleDailySubtotalByDate: Map<string, number>;
  visibleNoteCountByDate: Map<string, number>;
  monthlyTotal: number;
  editDraft: EditDraft | null;
  setEditDraft: Dispatch<SetStateAction<EditDraft | null>>;
  startInlineEdit: (transaction: LaundryTransaction) => void;
  onSaveInlineEdit: () => void | Promise<void>;
  onDeleteRow: (id: string) => void | Promise<void>;
  parsePriceInput: (raw: string) => number;
  formatPriceInput: (raw: string) => string;
  reportClientName: string;
  printKeterangan: string;
  username: string;
}

function ReportTableSectionComponent({
  selectedMonth,
  selectedMonthLabel,
  onSelectedMonthChange,
  isMonthLoading,
  isMonthReady,
  hasMonthError,
  monthErrorMessage,
  searchQuery,
  setSearchQuery,
  visibleTransactions,
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
  transactionError,
  finalReportTitle,
  visibleDailySubtotalByDate,
  visibleNoteCountByDate,
  monthlyTotal,
  editDraft,
  setEditDraft,
  startInlineEdit,
  onSaveInlineEdit,
  onDeleteRow,
  parsePriceInput,
  formatPriceInput,
  reportClientName,
  printKeterangan,
  username,
}: ReportTableSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      className="surface-card print-area min-w-0 rounded-2xl border border-[#e7ddd1]/80 bg-[#fbf8f4]/90 p-4 shadow-sm sm:p-5"
    >
      <ReportControls
        selectedMonth={selectedMonth}
        onSelectedMonthChange={onSelectedMonthChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        visibleCount={visibleTransactions.length}
        totalCount={totalAvailable}
        onResetAll={onResetAll}
        onPrint={onPrint}
        onSavePdf={onSavePdf}
        onDownloadXLSX={onDownloadXLSX}
        isSavingPdf={isSavingPdf}
        isExportingXlsx={isExportingXlsx}
        loadedCount={loadedCount}
        totalAvailable={totalAvailable}
        hasMoreTransactions={hasMoreTransactions}
        onLoadMoreTransactions={onLoadMoreTransactions}
        isLoadingMoreTransactions={isLoadingMoreTransactions}
        isMonthLoading={isMonthLoading}
        canExport={isMonthReady}
        transactionError={transactionError}
      />

      <div className="mt-5 rounded-2xl border border-[#e7ddd1]/80 bg-[#f8f1e8]/60 p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-2 border-b border-[#e7ddd1] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7764]">
              Report Table
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight text-[#2f2a25] sm:text-lg">
              {finalReportTitle}
            </p>
          </div>
          <p className="text-xs text-[#6d5d50]">
            {loadedCount} baris tampil dari {totalAvailable} baris bulan aktif
          </p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-[#e7ddd1] bg-[#fbf8f4]">
          <div className="relative max-h-[66vh] overflow-auto overscroll-contain">
            {isMonthLoading && !isMonthReady ? (
              <div className="space-y-2 p-3">
                <div className="h-10 animate-pulse rounded-md bg-[#eadfce]/80" />
                <div className="h-10 animate-pulse rounded-md bg-[#f4ece2]" />
                <div className="h-10 animate-pulse rounded-md bg-[#f4ece2]" />
                <div className="h-10 animate-pulse rounded-md bg-[#f4ece2]" />
              </div>
            ) : transactionError && visibleTransactions.length === 0 ? (
              <div className="bg-[#fbf8f4] p-4 sm:p-6">
                <div className="rounded-2xl border border-rose-200 bg-[#fff5f2]/90 p-6 text-center">
                  <p className="text-base font-semibold tracking-tight text-rose-700">
                    Gagal Memuat Bulan Aktif
                  </p>
                  <p className="mt-1 text-sm text-rose-600">{transactionError}</p>
                </div>
              </div>
            ) : visibleTransactions.length === 0 && !transactionError ? (
              <div className="bg-[#fbf8f4] p-4 sm:p-6">
                <EmptyState selectedMonthLabel={selectedMonthLabel} />
              </div>
            ) : (
              <div className="[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:shadow-[inset_0_-1px_0_0_rgba(148,163,184,0.25)]">
                <TransactionsTable
                  filteredTransactions={visibleTransactions}
                  dailySubtotalByDate={visibleDailySubtotalByDate}
                  noteCountByDate={visibleNoteCountByDate}
                  monthlyTotal={monthlyTotal}
                  editDraft={editDraft}
                  setEditDraft={setEditDraft}
                  startInlineEdit={startInlineEdit}
                  onSaveInlineEdit={onSaveInlineEdit}
                  onDeleteRow={onDeleteRow}
                  parsePriceInput={parsePriceInput}
                  formatPriceInput={formatPriceInput}
                />
              </div>
            )}
            {isMonthLoading && isMonthReady && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-[#fbf8f4]/50 pt-6 backdrop-blur-[1px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e7ddd1] bg-[#fbf8f4] px-3 py-1.5 text-xs font-medium text-[#5b4f44] shadow-sm">
                  <Spinner size="sm" />
                  Memuat bulan aktif...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReportSummary
        monthlyTotal={monthlyTotal}
        reportClientName={reportClientName}
        printKeterangan={printKeterangan}
        username={username}
        selectedMonthLabel={selectedMonthLabel}
        isMonthLoading={isMonthLoading}
        hasMonthError={hasMonthError}
        monthErrorMessage={monthErrorMessage}
      />
    </motion.div>
  );
}

export const ReportTableSection = memo(ReportTableSectionComponent);
