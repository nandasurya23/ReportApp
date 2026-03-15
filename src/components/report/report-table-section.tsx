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
  startDate: string;
  endDate: string;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  visibleTransactions: LaundryTransaction[];
  sortedTransactions: LaundryTransaction[];
  onResetAll: () => void;
  onPrint: () => void;
  onSavePdf: () => void | Promise<void>;
  onDownloadXLSX: () => void | Promise<void>;
  isSavingPdf: boolean;
  isExportingXlsx: boolean;
  isLoadingTransactions: boolean;
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
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  searchQuery,
  setSearchQuery,
  visibleTransactions,
  sortedTransactions,
  onResetAll,
  onPrint,
  onSavePdf,
  onDownloadXLSX,
  isSavingPdf,
  isExportingXlsx,
  isLoadingTransactions,
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
      className="surface-card print-area min-w-0 p-4 sm:p-6"
    >
      <ReportControls
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        visibleCount={visibleTransactions.length}
        totalCount={sortedTransactions.length}
        onResetAll={onResetAll}
        onPrint={onPrint}
        onSavePdf={onSavePdf}
        onDownloadXLSX={onDownloadXLSX}
        isSavingPdf={isSavingPdf}
        isExportingXlsx={isExportingXlsx}
        isLoadingTransactions={isLoadingTransactions}
        transactionError={transactionError}
      />

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold text-slate-900 sm:text-lg">{finalReportTitle}</p>
          <p className="text-xs text-slate-500">
            {visibleTransactions.length} dari {sortedTransactions.length} transaksi
          </p>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-slate-200">
          <div className="relative max-h-[66vh] overflow-auto overscroll-contain">
            {isLoadingTransactions && visibleTransactions.length === 0 ? (
              <div className="space-y-2 p-3">
                <div className="h-10 animate-pulse rounded-md bg-slate-200/80" />
                <div className="h-10 animate-pulse rounded-md bg-slate-100" />
                <div className="h-10 animate-pulse rounded-md bg-slate-100" />
                <div className="h-10 animate-pulse rounded-md bg-slate-100" />
              </div>
            ) : visibleTransactions.length === 0 ? (
              <div className="bg-white p-4 sm:p-6">
                <EmptyState />
              </div>
            ) : (
              <div className="[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:shadow-[inset_0_-1px_0_0_rgba(148,163,184,0.35)]">
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
            {isLoadingTransactions && visibleTransactions.length > 0 && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-white/45 pt-6 backdrop-blur-[1px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                  <Spinner size="sm" />
                  Memuat data...
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
      />
    </motion.div>
  );
}

export const ReportTableSection = memo(ReportTableSectionComponent);
