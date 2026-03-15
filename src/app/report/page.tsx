"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ReportPdfPreview } from "@/components/report/report-pdf-preview";
import { ReportStats } from "@/components/report/report-stats";
import { ReportTableSection } from "@/components/report/report-table-section";
import { ReportTopbar } from "@/components/report/report-topbar";
import { ReportTransactionForm } from "@/components/report/report-transaction-form";
import { Spinner } from "@/components/ui/spinner";
import { useReportAuth } from "@/app/report/use-report-auth";
import { useReportDerived } from "@/app/report/use-report-derived";
import { useReportTransactionsActions } from "@/app/report/use-report-transactions-actions";

import {
  setReportPreferences,
} from "@/lib/storage/local-storage";
import {
  getTransactionsPayload,
  getTransactionsRequest,
} from "@/lib/services/report-api";
import { formatDateWITA } from "@/lib/utils/date";
import { getDailyTotal } from "@/lib/utils/laundry";
import {
  buildExportRows as buildExportRowsData,
  formatThousands,
  formatPriceInput,
  mapTransactionRows,
  parsePriceInput,
} from "@/lib/utils/report-transform";
import { showResetAllConfirmation } from "@/lib/utils/report-feedback";
import { LaundryTransaction } from "@/types/laundry";

interface EditDraft {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: string;
  priceInput: string;
}

async function fetchTransactionsList(): Promise<LaundryTransaction[] | null> {
  try {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const allRows: LaundryTransaction[] = [];

    while (page <= totalPages) {
      const response = await getTransactionsRequest({ page, limit: pageSize });
      if (!response.ok) {
        return null;
      }
      const payload = await getTransactionsPayload(response);
      allRows.push(...mapTransactionRows(payload.transactions));
      const nextTotalPages = Number(payload.totalPages);
      totalPages = Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? Math.floor(nextTotalPages) : page;
      page += 1;
    }

    return allRows;
  } catch {
    return null;
  }
}

async function loadReportExportService() {
  return import("@/lib/services/report-export");
}

function getReportPdfFileName(visibleTransactions: LaundryTransaction[]) {
  if (visibleTransactions.length === 0) {
    return "laporan.pdf";
  }

  const timestamps = visibleTransactions
    .map((transaction) => new Date(transaction.date).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (timestamps.length === 0) {
    return "laporan.pdf";
  }

  const start = new Date(timestamps[0]);
  const end = new Date(timestamps[timestamps.length - 1]);
  const month = end
    .toLocaleDateString("id-ID", { month: "long" })
    .toLowerCase();

  return `laporan ${start.getDate()} - ${end.getDate()} ${month}.pdf`;
}

export default function ReportPage() {
  const pdfExportRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState("");
  const [transactions, setTransactionState] = useState<LaundryTransaction[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formRoomNumber, setFormRoomNumber] = useState("");
  const [reportClientName, setReportClientName] = useState("");
  const [reportKeterangan, setReportKeterangan] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formQuantityKg, setFormQuantityKg] = useState("1");
  const [formPriceInput, setFormPriceInput] = useState("");
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [error, setError] = useState("");
  const [transactionError, setTransactionError] = useState("");
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (isInitializing) {
      return;
    }
    const writeDelay = window.setTimeout(() => {
      setReportPreferences({
        clientName: reportClientName,
        keterangan: reportKeterangan,
        startDate: startDate || null,
        endDate: endDate || null,
      });
    }, 250);
    return () => {
      window.clearTimeout(writeDelay);
    };
  }, [reportClientName, reportKeterangan, startDate, endDate, isInitializing]);

  const { onLogout } = useReportAuth({
    isInitializing,
    setIsInitializing,
    setIsLoadingTransactions,
    setTransactionError,
    setUsername,
    setTransactionState,
    setReportClientName,
    setReportKeterangan,
    setStartDate,
    setEndDate,
    fetchTransactionsList,
  });

  const {
    sortedTransactions,
    monthlyTotal,
    dailySubtotalByDate,
    noteCountByDate,
    visibleTransactions,
    visibleDailySubtotalByDate,
    visibleNoteCountByDate,
    finalReportTitle,
    printKeterangan,
  } = useReportDerived({
    transactions,
    startDate,
    endDate,
    searchQuery,
    reportClientName,
    formDate,
    reportKeterangan,
  });

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

  const { onSubmitAdd, onSaveInlineEdit, onDeleteRow, performResetAll } =
    useReportTransactionsActions({
      fetchTransactionsList,
      isCreatingTransaction,
      isUpdatingTransaction,
      isDeletingTransaction,
      setIsCreatingTransaction,
      setIsUpdatingTransaction,
      setIsDeletingTransaction,
      setTransactionError,
      setTransactionState,
      setError,
      reportClientName,
      reportKeterangan,
      formDate,
      formRoomNumber,
      formQuantityKg,
      formPriceInput,
      setReportClientName,
      setReportKeterangan,
      setStartDate,
      setEndDate,
      setFormDate,
      setFormRoomNumber,
      setFormQuantityKg,
      setFormPriceInput,
      editDraft,
      setEditDraft,
    });

  const onDownloadXLSX = async () => {
    setIsExportingXlsx(true);
    try {
      const { downloadReportXLSX } = await loadReportExportService();
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
        formatDateWITA,
      });
    } finally {
      setIsExportingXlsx(false);
    }
  };

  const onPrint = useCallback(() => {
    window.print();
  }, []);

  const onSavePdf = useCallback(async () => {
    if (!pdfExportRef.current) {
      return;
    }
    setIsSavingPdf(true);
    try {
      const { saveReportPDF } = await loadReportExportService();
      pdfExportRef.current.setAttribute(
        "data-pdf-file-name",
        getReportPdfFileName(visibleTransactions),
      );
      await saveReportPDF(pdfExportRef.current);
    } finally {
      setIsSavingPdf(false);
    }
  }, [visibleTransactions]);

  const onResetAll = useCallback(() => {
    showResetAllConfirmation(performResetAll);
  }, [performResetAll]);

  const activeClientCount = reportClientName.trim() ? 1 : 0;
  const activeTransactionCount = sortedTransactions.length;

  if (isInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#ecfeff,transparent_35%),#f8fafc] px-4 py-6">
        <div className="surface-card flex w-full max-w-sm flex-col items-center gap-3 p-6 text-center">
          <Spinner size="lg" />
          <p className="text-base font-semibold text-slate-900">Memuat dashboard...</p>
          <p className="text-sm text-slate-600">Menyiapkan data report laundry kamu.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ecfeff,transparent_32%),radial-gradient(circle_at_top_right,#cffafe,transparent_30%),#f8fafc] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <ReportTopbar
            username={username}
            reportClientName={reportClientName}
            onLogout={onLogout}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ReportStats
            monthlyTotal={monthlyTotal}
            activeTransactionCount={activeTransactionCount}
            activeClientCount={activeClientCount}
          />
        </motion.div>

        <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 sm:p-4">
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
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              visibleTransactions={visibleTransactions}
              sortedTransactions={sortedTransactions}
              onResetAll={onResetAll}
              onPrint={onPrint}
              onSavePdf={onSavePdf}
              onDownloadXLSX={onDownloadXLSX}
              isSavingPdf={isSavingPdf}
              isExportingXlsx={isExportingXlsx}
              isLoadingTransactions={isLoadingTransactions}
              transactionError={transactionError}
              finalReportTitle={finalReportTitle}
              visibleDailySubtotalByDate={visibleDailySubtotalByDate}
              visibleNoteCountByDate={visibleNoteCountByDate}
              monthlyTotal={monthlyTotal}
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
        startDate={startDate}
        endDate={endDate}
        sortedTransactions={sortedTransactions}
        noteCountByDate={noteCountByDate}
        dailySubtotalByDate={dailySubtotalByDate}
        monthlyTotal={monthlyTotal}
      />
    </main>
  );
}
