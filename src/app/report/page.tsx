"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiEdit3,
  FiHome,
  FiPackage,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import { CustomDatePicker } from "@/components/report/custom-date-picker";
import { EmptyState } from "@/components/report/empty-state";
import { ReportControls } from "@/components/report/report-controls";
import { ReportStats } from "@/components/report/report-stats";
import { ReportSummary } from "@/components/report/report-summary";
import { ReportTopbar } from "@/components/report/report-topbar";
import { TransactionsTable } from "@/components/report/transactions-table";
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
import {
  downloadReportCSV,
  downloadReportXLSX,
  saveReportPDF,
} from "@/lib/services/report-export";
import { formatIDR } from "@/lib/utils/currency";
import { formatDateWITA, formatISODateToLongID } from "@/lib/utils/date";
import { getDailyTotal } from "@/lib/utils/laundry";
import {
  filterTransactionsBySearch,
  getDailySubtotalByDate,
  getNoteCountByDate,
} from "@/lib/utils/report-derived";
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
    const response = await getTransactionsRequest();
    if (!response.ok) {
      return null;
    }
    const payload = await getTransactionsPayload(response);
    return mapTransactionRows(payload.transactions);
  } catch {
    return null;
  }
}

export default function ReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);
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
    setReportPreferences({
      clientName: reportClientName,
      keterangan: reportKeterangan,
      startDate: startDate || null,
      endDate: endDate || null,
    });
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
    finalReportTitle,
    printKeterangan,
  } = useReportDerived({
    transactions,
    startDate,
    endDate,
    reportClientName,
    formDate,
    reportKeterangan,
  });

  const visibleTransactions = useMemo(() => {
    return filterTransactionsBySearch(sortedTransactions, searchQuery);
  }, [searchQuery, sortedTransactions]);

  const visibleDailySubtotalByDate = useMemo(() => {
    return getDailySubtotalByDate(visibleTransactions);
  }, [visibleTransactions]);

  const visibleNoteCountByDate = useMemo(() => {
    return getNoteCountByDate(visibleTransactions);
  }, [visibleTransactions]);

  const startInlineEdit = (transaction: LaundryTransaction) => {
    setEditDraft({
      id: transaction.id,
      date: transaction.date,
      roomNumber: transaction.roomNumber,
      clientName: transaction.clientName,
      quantityKg: String(transaction.quantityKg),
      priceInput: formatThousands(transaction.pricePerKg),
    });
    setError("");
  };

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

  const onDownloadCSV = () => {
    downloadReportCSV({
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
  };

  const onDownloadXLSX = async () => {
    setIsExportingXlsx(true);
    try {
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

  const onPrint = () => {
    window.print();
  };

  const onSavePdf = async () => {
    if (!pdfExportRef.current) {
      return;
    }
    setIsSavingPdf(true);
    try {
      await saveReportPDF(pdfExportRef.current);
    } finally {
      setIsSavingPdf(false);
    }
  };

  const onResetAll = () => {
    showResetAllConfirmation(performResetAll);
  };

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
          <motion.form
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            onSubmit={onSubmitAdd}
            className="surface-card no-print h-fit p-4 sm:p-5 xl:sticky xl:top-6"
          >
            <div className="mb-4 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">Form Transaksi</h2>
              <p className="mt-1 text-xs text-slate-600">
                Isi data harian untuk akumulasi laporan bulanan.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3">
                <CustomDatePicker
                  id="date"
                  value={formDate}
                  label="Tanggal"
                  onChange={setFormDate}
                />
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-white p-3">
                <label htmlFor="room-number" className="field-label flex items-center gap-1.5">
                  <FiHome className="text-slate-500" />
                  No Kamar
                </label>
                <div className="relative">
                  <FiHome className="input-leading-icon" />
                  <input
                    id="room-number"
                    type="text"
                    value={formRoomNumber}
                    onChange={(event) => setFormRoomNumber(event.target.value)}
                    className="input-field input-with-icon"
                    placeholder="Contoh: A-12"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-white p-3">
                <label htmlFor="client-name" className="field-label flex items-center gap-1.5">
                  <FiUsers className="text-slate-500" />
                  Nama Client (diisi sekali)
                </label>
                <div className="relative">
                  <FiUsers className="input-leading-icon" />
                  <input
                    id="client-name"
                    type="text"
                    value={reportClientName}
                    onChange={(event) => setReportClientName(event.target.value)}
                    className="input-field input-with-icon"
                    placeholder="Contoh: John Doe"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-white p-3">
                <label htmlFor="keterangan" className="field-label flex items-center gap-1.5">
                  <FiEdit3 className="text-slate-500" />
                  Keterangan (diisi sekali)
                </label>
                <div className="relative">
                  <FiEdit3 className="input-leading-icon" />
                  <input
                    id="keterangan"
                    type="text"
                    value={reportKeterangan}
                    onChange={(event) => setReportKeterangan(event.target.value)}
                    className="input-field input-with-icon"
                    placeholder='Contoh: "bawa hari minggu"'
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200/90 bg-white p-3">
                  <label htmlFor="qty" className="field-label flex items-center gap-1.5">
                    <FiPackage className="text-slate-500" />
                    Satuan
                  </label>
                  <div className="relative">
                    <FiPackage className="input-leading-icon" />
                    <input
                      id="qty"
                      type="text"
                      inputMode="decimal"
                      value={formQuantityKg}
                      onChange={(event) => {
                        const nextValue = event.target.value.replace(",", ".");
                        if (nextValue === "") {
                          setFormQuantityKg("");
                          return;
                        }
                        if (!/^\d*(\.\d?)?$/.test(nextValue)) {
                          return;
                        }
                        setFormQuantityKg(nextValue);
                      }}
                      className="input-field input-with-icon"
                      placeholder="Contoh: 1 atau 1.5"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-white p-3">
                  <label htmlFor="price" className="field-label flex items-center gap-1.5">
                    <FiTag className="text-slate-500" />
                    Harga
                  </label>
                  <div className="relative">
                    <FiTag className="input-leading-icon" />
                    <input
                      id="price"
                      type="text"
                      inputMode="numeric"
                      value={formPriceInput}
                      onChange={(event) => setFormPriceInput(formatPriceInput(event.target.value))}
                      className="input-field input-with-icon"
                      placeholder="Contoh: 1.000.000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={isCreatingTransaction}
              className="btn btn-primary mt-4 flex w-full items-center justify-center gap-2 py-2.5"
            >
              {isCreatingTransaction && (
                <Spinner size="sm" className="border-slate-200 border-t-white" />
              )}
              <FiPlus className="text-base" />
              {isCreatingTransaction ? "Menyimpan..." : "Tambah"}
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            ref={reportRef}
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
              onDownloadCSV={onDownloadCSV}
              onDownloadXLSX={onDownloadXLSX}
              isSavingPdf={isSavingPdf}
              isExportingXlsx={isExportingXlsx}
              isLoadingTransactions={isLoadingTransactions}
              transactionError={transactionError}
            />

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-base font-semibold text-slate-900 sm:text-lg">
                  {finalReportTitle}
                </p>
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
        </div>
        </section>
      </div>

      <div
        aria-hidden="true"
        className="fixed -left-2499.75 top-0"
        ref={pdfExportRef}
        style={{
          width: "794px",
          background: "#ffffff",
          color: "#0f172a",
          padding: "26px",
          fontFamily: "Segoe UI, Arial, sans-serif",
        }}
      >
        <div
          style={{
            marginBottom: "14px",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "12px 14px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700 }}>{finalReportTitle}</h2>
          <p style={{ margin: "7px 0 0", fontSize: "12px", color: "#475569" }}>
            Periode: {startDate || "-"} s/d {endDate || "-"}
          </p>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: "12px",
            color: "#0f172a",
          }}
        >
          <thead>
            <tr style={{ background: "#e2e8f0" }}>
              {[
                "Nomer",
                "Tanggal tahun bulan",
                "Jumlah Nota",
                "No Kamar",
                "Satuan",
                "Harga",
                "Harga Total Harian",
                "Total Keseluruhan",
                "Keterangan",
              ].map(
                (head) => (
                  <th
                    key={head}
                    style={{
                      border: "1px solid #cbd5e1",
                      padding: "8px 7px",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction, index) => {
              const isFirstDateRow =
                index === 0 || sortedTransactions[index - 1].date !== transaction.date;
              return (
              <tr key={transaction.id}>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>{index + 1}</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {isFirstDateRow ? formatISODateToLongID(transaction.date) : ""}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {noteCountByDate.get(transaction.id) ?? 0}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign:"center" }}>
                  {transaction.roomNumber}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {transaction.quantityKg}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {formatIDR(transaction.pricePerKg)}
                </td>
                <td
                  style={{
                    border: "1px solid #cbd5e1",
                    padding: "7px 7px",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {formatIDR(getDailyTotal(transaction))}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {isFirstDateRow ? formatIDR(dailySubtotalByDate.get(transaction.date) ?? 0) : ""}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {isFirstDateRow ? transaction.clientName : ""}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
        <div
          style={{
            marginTop: "10px",
            border: "1px solid #cbd5e1",
            background: "#e2e8f0",
            padding: "8px 10px",
            textAlign: "right",
          }}
        >
          <p style={{ margin: 0, fontSize: "11px", fontWeight: 600 }}>Total Bulanan</p>
          <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 700 }}>
            {formatIDR(monthlyTotal)}
          </p>
        </div>
      </div>
    </main>
  );
}
