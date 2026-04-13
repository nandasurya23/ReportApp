"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { useDebounce } from "@/hooks/use-debounce";

import { ReportPdfPreview } from "@/components/report/report-pdf-preview";
import { ReportStats } from "@/components/report/report-stats";
import { ReportTableSection } from "@/components/report/report-table-section";
import { ReportTopbar } from "@/components/report/report-topbar";
import { ReportTransactionForm } from "@/components/report/report-transaction-form";
import { Spinner } from "@/components/ui/spinner";
import { useReportAuth } from "@/app/report/use-report-auth";
import { useReportDerived } from "@/app/report/use-report-derived";
import { useReportTransactionsActions } from "@/app/report/use-report-transactions-actions";
import { setReportPreferences } from "@/lib/storage/local-storage";
import {
  getTransactionsPayload,
  getTransactionsRequest,
} from "@/lib/services/report-api";
import { formatMonthYearLabel, getCurrentMonthKey } from "@/lib/utils/date";
import { getDailyTotal } from "@/lib/utils/laundry";
import { showResetAllConfirmation } from "@/lib/utils/report-feedback";
import {
  buildExportRows as buildExportRowsData,
  formatPriceInput,
  formatThousands,
  mapTransactionRows,
  parsePriceInput,
} from "@/lib/utils/report-transform";
import { LaundryTransaction } from "@/types/laundry";

const DEFAULT_VISIBLE_ROWS = 100;
const LOAD_MORE_STEP = 100;

interface EditDraft {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: string;
  priceInput: string;
}

function getReportPdfFileName(selectedMonthLabel: string) {
  return `laporan ${selectedMonthLabel}.pdf`;
}

export default function ReportPage() {
  const pdfExportRef = useRef<HTMLDivElement>(null);
  const monthRequestSequenceRef = useRef(0);
  const monthAbortRef = useRef<AbortController | null>(null);

  const [username, setUsername] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [monthTransactions, setMonthTransactions] = useState<LaundryTransaction[] | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(0);
  const [reportClientName, setReportClientName] = useState("");
  const [reportKeterangan, setReportKeterangan] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formRoomNumber, setFormRoomNumber] = useState("");
  const [formQuantityKg, setFormQuantityKg] = useState("1");
  const [formPriceInput, setFormPriceInput] = useState(formatThousands(15000));
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [error, setError] = useState("");
  const [transactionError, setTransactionError] = useState("");
  const [isMonthLoading, setIsMonthLoading] = useState(true);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingMoreTransactions, setIsLoadingMoreTransactions] = useState(false);

  const resetActiveMonthView = useCallback(() => {
    monthAbortRef.current?.abort();
    monthAbortRef.current = null;
    setMonthTransactions(null);
    setVisibleLimit(0);
    setTransactionError("");
    setError("");
    setIsLoadingMoreTransactions(false);
    setIsMonthLoading(true);
  }, []);

  const loadActiveMonthData = useCallback(
    async (monthKey: string) => {
      const requestId = ++monthRequestSequenceRef.current;
      const controller = new AbortController();
      monthAbortRef.current?.abort();
      monthAbortRef.current = controller;
      setIsMonthLoading(true);
      setTransactionError("");

      try {
        const response = await getTransactionsRequest({
          month: monthKey,
          scope: "month",
          signal: controller.signal,
        });
        if (controller.signal.aborted || requestId !== monthRequestSequenceRef.current) {
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to load month dataset.");
        }

        const payload = await getTransactionsPayload(response);
        if (controller.signal.aborted || requestId !== monthRequestSequenceRef.current) {
          return;
        }

        const nextTransactions = mapTransactionRows(payload.transactions);
        setMonthTransactions(nextTransactions);
        setVisibleLimit(Math.min(DEFAULT_VISIBLE_ROWS, nextTransactions.length));
      } catch {
        if (controller.signal.aborted || requestId !== monthRequestSequenceRef.current) {
          return;
        }
        setMonthTransactions(null);
        setVisibleLimit(0);
        setTransactionError("Gagal memuat transaksi bulan aktif.");
      } finally {
        if (controller.signal.aborted || requestId !== monthRequestSequenceRef.current) {
          return;
        }
        setIsMonthLoading(false);
        if (monthAbortRef.current === controller) {
          monthAbortRef.current = null;
        }
      }
    },
    [],
  );

  const handleSelectedMonthChange = useCallback(
    (value: string) => {
      if (!value || value === selectedMonth) {
        return;
      }
      resetActiveMonthView();
      setSelectedMonth(value);
    },
    [resetActiveMonthView, selectedMonth],
  );

  useEffect(() => {
    if (isInitializing) {
      return;
    }
    void loadActiveMonthData(selectedMonth);
    return () => {
      monthAbortRef.current?.abort();
    };
  }, [isInitializing, loadActiveMonthData, selectedMonth]);

  useEffect(() => {
    if (isInitializing) {
      return;
    }
    const writeDelay = window.setTimeout(() => {
      setReportPreferences({
        clientName: reportClientName,
        keterangan: reportKeterangan,
        startDate: null,
        endDate: null,
      });
    }, 250);
    return () => {
      window.clearTimeout(writeDelay);
    };
  }, [reportClientName, reportKeterangan, isInitializing]);

  const { onLogout } = useReportAuth({
    isInitializing,
    setIsInitializing,
    setUsername,
    setReportClientName,
    setReportKeterangan,
  });

  const {
    sortedTransactions,
    monthlyTotal,
    dailySubtotalByDate,
    noteCountByDate,
    searchFilteredTransactions,
    visibleTransactions,
    visibleDailySubtotalByDate,
    visibleNoteCountByDate,
    finalReportTitle,
    printKeterangan,
  } = useReportDerived({
    transactions: monthTransactions ?? [],
    searchQuery: debouncedSearchQuery,
    visibleLimit,
    reportClientName,
    selectedMonth,
    reportKeterangan,
  });

  const hasMonthDataReady = monthTransactions !== null && !isMonthLoading;
  const hasMonthError = Boolean(transactionError) && !hasMonthDataReady;
  const selectedMonthLabel = useMemo(
    () => formatMonthYearLabel(selectedMonth),
    [selectedMonth],
  );
  const activeTransactionCount = sortedTransactions.length;
  const visibleTransactionCount = visibleTransactions.length;
  const hasMoreTransactions =
    hasMonthDataReady && visibleTransactionCount < searchFilteredTransactions.length;

  const startInlineEdit = useCallback((transaction: LaundryTransaction) => {
    setEditDraft({
      id: transaction.id,
      date: transaction.date,
      roomNumber: transaction.roomNumber,
      clientName: transaction.clientName,
      quantityKg: String(transaction.quantityKg),
      priceInput: formatThousands(transaction.pricePerKg),
    });
    setError("");
  }, []);

  const reloadActiveMonthData = useCallback(async () => {
    await loadActiveMonthData(selectedMonth);
  }, [loadActiveMonthData, selectedMonth]);

  const { onSubmitAdd, onSaveInlineEdit, onDeleteRow, performResetAll } =
    useReportTransactionsActions({
      reloadActiveMonthData,
      isCreatingTransaction,
      isUpdatingTransaction,
      isDeletingTransaction,
      setIsCreatingTransaction,
      setIsUpdatingTransaction,
      setIsDeletingTransaction,
      setTransactionError,
      setTransactionState: setMonthTransactions as unknown as (value: unknown) => void,
      setVisibleLimit,
      setError,
      reportClientName,
      reportKeterangan,
      formDate,
      formRoomNumber,
      formQuantityKg,
      formPriceInput,
      setReportClientName,
      setReportKeterangan,
      setFormDate,
      setFormRoomNumber,
      setFormQuantityKg,
      setFormPriceInput,
      editDraft,
      setEditDraft,
    });

  const onDownloadXLSX = useCallback(async () => {
    if (!hasMonthDataReady) {
      return;
    }
    setIsExportingXlsx(true);
    try {
      const { downloadReportXLSX } = await import("@/lib/services/report-export");
      await downloadReportXLSX({
        rows: buildExportRowsData({
          sortedTransactions,
          noteCountByDate,
          dailySubtotalByDate,
          getDailyTotal,
        }),
        printKeterangan,
        monthlyTotal,
        username,
        formatDateWITA: () =>
          new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date()),
      });
    } finally {
      setIsExportingXlsx(false);
    }
  }, [
    dailySubtotalByDate,
    hasMonthDataReady,
    monthlyTotal,
    noteCountByDate,
    printKeterangan,
    sortedTransactions,
    username,
  ]);

  const onPrint = useCallback(() => {
    window.print();
  }, []);

  const onSavePdf = useCallback(async () => {
    if (!hasMonthDataReady || !pdfExportRef.current) {
      return;
    }
    setIsSavingPdf(true);
    try {
      const { saveReportPDF } = await import("@/lib/services/report-export");
      pdfExportRef.current.setAttribute(
        "data-pdf-file-name",
        getReportPdfFileName(selectedMonthLabel),
      );
      await saveReportPDF(pdfExportRef.current);
    } finally {
      setIsSavingPdf(false);
    }
  }, [hasMonthDataReady, selectedMonthLabel]);

  const onResetAll = useCallback(() => {
    showResetAllConfirmation(performResetAll);
  }, [performResetAll]);

  const onLoadMoreTransactions = useCallback(() => {
    if (!hasMoreTransactions || isLoadingMoreTransactions || !hasMonthDataReady) {
      return;
    }
    setIsLoadingMoreTransactions(true);
    setVisibleLimit((prev) =>
      Math.min(prev + LOAD_MORE_STEP, searchFilteredTransactions.length),
    );
    window.setTimeout(() => {
      setIsLoadingMoreTransactions(false);
    }, 0);
  }, [
    hasMonthDataReady,
    hasMoreTransactions,
    isLoadingMoreTransactions,
    searchFilteredTransactions.length,
  ]);

  if (isInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f1e8] px-4 py-6">
        <div className="surface-card flex w-full max-w-sm flex-col items-center gap-3 p-6 text-center">
          <Spinner size="lg" />
          <p className="text-base font-semibold text-slate-900">Memuat dashboard...</p>
          <p className="text-sm text-slate-600">Menyiapkan data report laundry kamu.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <ReportTopbar
            username={username}
            reportClientName={reportClientName}
            selectedMonthLabel={selectedMonthLabel}
            onLogout={onLogout}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ReportStats
            monthlyTotal={hasMonthDataReady ? monthlyTotal : null}
            activeTransactionCount={hasMonthDataReady ? activeTransactionCount : null}
            activeClientCount={reportClientName.trim() ? 1 : 0}
            selectedMonthLabel={selectedMonthLabel}
            isMonthLoading={isMonthLoading}
            hasMonthError={hasMonthError}
            monthErrorMessage={transactionError}
          />
        </motion.div>

        <section className="rounded-2xl border border-[#e7ddd1]/80 bg-[#fbf8f4]/80 p-3 shadow-sm sm:p-4">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <ReportTransactionForm
              onSubmitAdd={onSubmitAdd}
              formDate={formDate}
              setFormDate={setFormDate}
              formRoomNumber={formRoomNumber}
              setFormRoomNumber={setFormRoomNumber}
              reportClientName={reportClientName}
              setReportClientName={setReportClientName}
              reportKeterangan={reportKeterangan}
              setReportKeterangan={setReportKeterangan}
              formQuantityKg={formQuantityKg}
              setFormQuantityKg={setFormQuantityKg}
              formPriceInput={formPriceInput}
              setFormPriceInput={setFormPriceInput}
              formatPriceInput={formatPriceInput}
              error={error}
              isCreatingTransaction={isCreatingTransaction}
            />

            <ReportTableSection
              selectedMonth={selectedMonth}
              selectedMonthLabel={selectedMonthLabel}
              onSelectedMonthChange={handleSelectedMonthChange}
              isMonthLoading={isMonthLoading}
              isMonthReady={hasMonthDataReady}
              hasMonthError={hasMonthError}
              monthErrorMessage={transactionError}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              visibleTransactions={visibleTransactions}
              onResetAll={onResetAll}
              onPrint={onPrint}
              onSavePdf={onSavePdf}
              onDownloadXLSX={onDownloadXLSX}
              isSavingPdf={isSavingPdf}
              isExportingXlsx={isExportingXlsx}
              loadedCount={visibleTransactionCount}
              totalAvailable={searchFilteredTransactions.length}
              hasMoreTransactions={hasMoreTransactions}
              onLoadMoreTransactions={onLoadMoreTransactions}
              isLoadingMoreTransactions={isLoadingMoreTransactions}
              transactionError={transactionError}
              finalReportTitle={finalReportTitle}
              visibleDailySubtotalByDate={visibleDailySubtotalByDate}
              visibleNoteCountByDate={visibleNoteCountByDate}
              monthlyTotal={hasMonthDataReady ? monthlyTotal : 0}
              editDraft={editDraft}
              setEditDraft={setEditDraft}
              startInlineEdit={startInlineEdit}
              onSaveInlineEdit={onSaveInlineEdit}
              onDeleteRow={onDeleteRow}
              parsePriceInput={parsePriceInput}
              formatPriceInput={formatPriceInput}
              reportClientName={reportClientName}
              printKeterangan={printKeterangan}
              username={username}
            />
          </div>
        </section>
      </div>

      <ReportPdfPreview
        pdfExportRef={pdfExportRef}
        finalReportTitle={finalReportTitle}
        selectedMonthLabel={selectedMonthLabel}
        isMonthLoading={isMonthLoading}
        sortedTransactions={sortedTransactions}
        noteCountByDate={noteCountByDate}
        dailySubtotalByDate={dailySubtotalByDate}
        monthlyTotal={hasMonthDataReady ? monthlyTotal : 0}
      />
    </main>
  );
}
