"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Workbook } from "exceljs";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRouter } from "next/navigation";
import {
  FiDownload,
  FiPlus,
  FiEdit3,
  FiGrid,
  FiFileText,
  FiHome,
  FiList,
  FiLogOut,
  FiPackage,
  FiPrinter,
  FiRefreshCw,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import { CustomDatePicker } from "@/components/report/custom-date-picker";
import { EmptyState } from "@/components/report/empty-state";
import { TransactionsTable } from "@/components/report/transactions-table";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

import {
  clearAuthSession,
  getReportPreferences,
  setAuthSession,
  setReportPreferences,
} from "@/lib/storage/local-storage";
import { formatIDR } from "@/lib/utils/currency";
import { formatDateWITA, formatISODateToLongID } from "@/lib/utils/date";
import { getDailyTotal, getMonthlyTotal } from "@/lib/utils/laundry";
import { LaundryTransaction } from "@/types/laundry";

interface EditDraft {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: string;
  priceInput: string;
}

function formatThousands(value: number): string {
  return value.toLocaleString("id-ID");
}

function sanitizeNumberInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function formatPriceInput(raw: string): string {
  const digits = sanitizeNumberInput(raw);
  if (!digits) {
    return "";
  }
  return formatThousands(Number(digits));
}

function parsePriceInput(raw: string): number {
  const digits = sanitizeNumberInput(raw);
  if (!digits) {
    return 0;
  }
  return Number(digits);
}

function parseQuantityInput(raw: string): number {
  const normalized = raw.replace(",", ".").trim();
  if (!normalized) {
    return 0;
  }
  return Number(normalized);
}

export default function ReportPage() {
  const INACTIVITY_LOGOUT_MS = 60 * 60 * 1000;
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const pdfExportRef = useRef<HTMLDivElement>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const [username, setUsername] = useState("");
  const [transactions, setTransactionState] = useState<LaundryTransaction[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formRoomNumber, setFormRoomNumber] = useState("");
  const [reportClientName, setReportClientName] = useState("");
  const [reportKeterangan, setReportKeterangan] = useState("");
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
    let cancelled = false;

    const loadTransactionsFromBackend = async (): Promise<LaundryTransaction[] | null> => {
      setIsLoadingTransactions(true);
      setTransactionError("");
      try {
        const transactionResponse = await fetch("/api/transactions", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!transactionResponse.ok) {
          setTransactionError("Gagal memuat transaksi dari server.");
          return null;
        }
        const transactionPayload = (await transactionResponse.json().catch(() => ({}))) as {
          transactions?: Array<{
            id: string;
            date: string;
            roomNumber: string;
            clientName: string;
            quantityKg: number | string;
            pricePerKg: number | string;
          }>;
        };
        return (transactionPayload.transactions ?? []).map((transaction) => ({
          id: transaction.id,
          date: transaction.date,
          roomNumber: transaction.roomNumber,
          clientName: transaction.clientName,
          quantityKg: Number(transaction.quantityKg),
          pricePerKg: Number(transaction.pricePerKg),
        }));
      } catch {
        setTransactionError("Gagal memuat transaksi dari server.");
        return null;
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    const bootstrap = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as {
          user?: { username?: string };
        };

        if (!response.ok || !payload.user?.username) {
          clearAuthSession();
          if (!cancelled) {
            router.replace("/login");
          }
          return;
        }

        if (cancelled) {
          return;
        }

        setAuthSession({
          username: payload.user.username,
          loggedInAt: new Date().toISOString(),
        });
        const preferences = getReportPreferences();
        const backendTransactions = await loadTransactionsFromBackend();
        setUsername(payload.user.username);
        const nextTransactions = backendTransactions ?? [];
        setTransactionState(nextTransactions);
        setReportClientName(preferences.clientName);
        setReportKeterangan(preferences.keterangan);
        setStartDate(preferences.startDate ?? "");
        setEndDate(preferences.endDate ?? "");
      } catch {
        clearAuthSession();
        if (!cancelled) {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [router]);

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

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    let isLoggingOut = false;
    const clearTimer = () => {
      if (inactivityTimeoutRef.current !== null) {
        window.clearTimeout(inactivityTimeoutRef.current);
      }
      inactivityTimeoutRef.current = null;
    };

    const logoutForInactivity = async () => {
      if (isLoggingOut) {
        return;
      }
      isLoggingOut = true;
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // no-op: local cleanup still runs
      } finally {
        clearAuthSession();
        router.replace("/login");
      }
    };

    const resetInactivityTimer = () => {
      clearTimer();
      inactivityTimeoutRef.current = window.setTimeout(() => {
        void logoutForInactivity();
      }, INACTIVITY_LOGOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    resetInactivityTimer();

    return () => {
      clearTimer();
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [isInitializing, router]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (startDate && transaction.date < startDate) {
        return false;
      }
      if (endDate && transaction.date > endDate) {
        return false;
      }
      return true;
    });
  }, [transactions, startDate, endDate]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }

      if (a.quantityKg !== b.quantityKg) {
        return a.quantityKg - b.quantityKg;
      }

      const roomA = Number(a.roomNumber.replace(/[^\d]/g, ""));
      const roomB = Number(b.roomNumber.replace(/[^\d]/g, ""));
      const hasRoomNumA = !Number.isNaN(roomA) && roomA > 0;
      const hasRoomNumB = !Number.isNaN(roomB) && roomB > 0;

      if (hasRoomNumA && hasRoomNumB && roomA !== roomB) {
        return roomA - roomB;
      }
      if (a.roomNumber !== b.roomNumber) {
        return a.roomNumber.localeCompare(b.roomNumber, "id");
      }

      return getDailyTotal(a) - getDailyTotal(b);
    });
  }, [filteredTransactions]);

  const monthlyTotal = useMemo(() => {
    return getMonthlyTotal(sortedTransactions);
  }, [sortedTransactions]);

  const dailySubtotalByDate = useMemo(() => {
    const subtotalMap = new Map<string, number>();
    sortedTransactions.forEach((transaction) => {
      subtotalMap.set(
        transaction.date,
        (subtotalMap.get(transaction.date) ?? 0) + getDailyTotal(transaction),
      );
    });
    return subtotalMap;
  }, [sortedTransactions]);

  const noteCountByDate = useMemo(() => {
    const dateCounter = new Map<string, number>();
    const noteMap = new Map<string, number>();
    sortedTransactions.forEach((transaction) => {
      const next = (dateCounter.get(transaction.date) ?? 0) + 1;
      dateCounter.set(transaction.date, next);
      noteMap.set(transaction.id, next);
    });
    return noteMap;
  }, [sortedTransactions]);

  const printKeterangan = reportKeterangan.trim() || "-";
  const activeDateContext = startDate || endDate || formDate;
  const activeDate = new Date(`${activeDateContext}T00:00:00`);
  const activeMonthYear = Number.isNaN(activeDate.getTime())
    ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date())
    : new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(activeDate);
  const autoReportTitle = `Laporan ${reportClientName.trim() || "Nama Client"} - ${activeMonthYear}`;
  const finalReportTitle = autoReportTitle;

  const validateInput = (input: {
    date: string;
    roomNumber: string;
    keterangan: string;
    quantityKg: number;
    pricePerKg: number;
  }): string => {
    if (!input.date) {
      return "Tanggal transaksi wajib diisi.";
    }
    if (!input.roomNumber.trim()) {
      return "No kamar wajib diisi.";
    }
    if (!reportClientName.trim()) {
      return "Nama client wajib diisi.";
    }
    if (!input.keterangan.trim()) {
      return "Keterangan wajib diisi.";
    }
    if (input.quantityKg <= 0) {
      return "Jumlah laundry harus lebih dari 0.";
    }
    if (!Number.isFinite(input.quantityKg)) {
      return "Satuan tidak valid.";
    }
    const halfStep = input.quantityKg * 2;
    if (!Number.isInteger(halfStep)) {
      return "Satuan hanya boleh kelipatan 0.5 KG.";
    }
    if (input.pricePerKg < 0) {
      return "Harga per KG tidak boleh negatif.";
    }
    return "";
  };

  const onSubmitAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingTransaction) {
      return;
    }

    const keterangan = reportKeterangan.trim();
    const quantityKg = parseQuantityInput(formQuantityKg);
    const pricePerKg = parsePriceInput(formPriceInput);
    const message = validateInput({
      date: formDate,
      roomNumber: formRoomNumber,
      keterangan,
      quantityKg,
      pricePerKg,
    });
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setIsCreatingTransaction(true);
      setTransactionError("");
      const createResponse = await fetch("/api/transactions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formDate,
          roomNumber: formRoomNumber.trim(),
          clientName: keterangan,
          quantityKg,
          pricePerKg,
        }),
      });

      if (!createResponse.ok) {
        const payload = (await createResponse.json().catch(() => ({}))) as { error?: string };
        const message = payload.error || "Gagal menambahkan transaksi.";
        setError(message);
        setTransactionError(message);
        toast.error(message);
        return;
      }

      const listResponse = await fetch("/api/transactions", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (listResponse.ok) {
        const listPayload = (await listResponse.json().catch(() => ({}))) as {
          transactions?: Array<{
            id: string;
            date: string;
            roomNumber: string;
            clientName: string;
            quantityKg: number | string;
            pricePerKg: number | string;
          }>;
        };
        const nextTransactions = (listPayload.transactions ?? []).map((transaction) => ({
          id: transaction.id,
          date: transaction.date,
          roomNumber: transaction.roomNumber,
          clientName: transaction.clientName,
          quantityKg: Number(transaction.quantityKg),
          pricePerKg: Number(transaction.pricePerKg),
        }));
        setTransactionState(nextTransactions);
      } else {
        setTransactionError("Transaksi berhasil ditambah, tapi gagal memuat ulang data.");
      }

      setFormDate(new Date().toISOString().slice(0, 10));
      setFormRoomNumber("");
      setFormQuantityKg("1");
      setFormPriceInput("");
      setError("");
      toast.success("Transaksi baru berhasil ditambahkan.");
    } catch {
      const message = "Gagal menambahkan transaksi.";
      setError(message);
      setTransactionError(message);
      toast.error(message);
    } finally {
      setIsCreatingTransaction(false);
    }
  };

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

  const onSaveInlineEdit = async () => {
    if (!editDraft) {
      return;
    }
    if (isUpdatingTransaction) {
      return;
    }

    const quantityKg = parseQuantityInput(editDraft.quantityKg);
    const pricePerKg = parsePriceInput(editDraft.priceInput);
    const message = validateInput({
      date: editDraft.date,
      roomNumber: editDraft.roomNumber,
      keterangan: editDraft.clientName,
      quantityKg,
      pricePerKg,
    });
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setIsUpdatingTransaction(true);
      setTransactionError("");
      const updateResponse = await fetch(`/api/transactions/${editDraft.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: editDraft.date,
          roomNumber: editDraft.roomNumber.trim(),
          clientName: editDraft.clientName.trim(),
          quantityKg,
          pricePerKg,
        }),
      });

      if (!updateResponse.ok) {
        const payload = (await updateResponse.json().catch(() => ({}))) as { error?: string };
        const message = payload.error || "Gagal memperbarui transaksi.";
        setError(message);
        setTransactionError(message);
        toast.error(message);
        return;
      }

      const listResponse = await fetch("/api/transactions", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (listResponse.ok) {
        const listPayload = (await listResponse.json().catch(() => ({}))) as {
          transactions?: Array<{
            id: string;
            date: string;
            roomNumber: string;
            clientName: string;
            quantityKg: number | string;
            pricePerKg: number | string;
          }>;
        };
        const nextTransactions = (listPayload.transactions ?? []).map((transaction) => ({
          id: transaction.id,
          date: transaction.date,
          roomNumber: transaction.roomNumber,
          clientName: transaction.clientName,
          quantityKg: Number(transaction.quantityKg),
          pricePerKg: Number(transaction.pricePerKg),
        }));
        setTransactionState(nextTransactions);
      } else {
        setTransactionError("Transaksi berhasil diupdate, tapi gagal memuat ulang data.");
      }

      setEditDraft(null);
      setError("");
      toast.success("Perubahan transaksi berhasil disimpan.");
    } catch {
      const message = "Gagal memperbarui transaksi.";
      setError(message);
      setTransactionError(message);
      toast.error(message);
    } finally {
      setIsUpdatingTransaction(false);
    }
  };

  const onDeleteRow = async (id: string) => {
    if (isDeletingTransaction) {
      return;
    }
    try {
      setIsDeletingTransaction(true);
      setTransactionError("");
      const deleteResponse = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!deleteResponse.ok) {
        const payload = (await deleteResponse.json().catch(() => ({}))) as { error?: string };
        const message = payload.error || "Gagal menghapus transaksi.";
        setTransactionError(message);
        toast.error(message);
        return;
      }

      const listResponse = await fetch("/api/transactions", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (listResponse.ok) {
        const listPayload = (await listResponse.json().catch(() => ({}))) as {
          transactions?: Array<{
            id: string;
            date: string;
            roomNumber: string;
            clientName: string;
            quantityKg: number | string;
            pricePerKg: number | string;
          }>;
        };
        const nextTransactions = (listPayload.transactions ?? []).map((transaction) => ({
          id: transaction.id,
          date: transaction.date,
          roomNumber: transaction.roomNumber,
          clientName: transaction.clientName,
          quantityKg: Number(transaction.quantityKg),
          pricePerKg: Number(transaction.pricePerKg),
        }));
        setTransactionState(nextTransactions);
      } else {
        setTransactionError("Transaksi berhasil dihapus, tapi gagal memuat ulang data.");
      }

      if (editDraft?.id === id) {
        setEditDraft(null);
      }
      toast.success("Transaksi berhasil dihapus.");
    } catch {
      setTransactionError("Gagal menghapus transaksi.");
      toast.error("Gagal menghapus transaksi.");
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // no-op: client-side cleanup still runs
    } finally {
      clearAuthSession();
      router.replace("/login");
    }
  };

  const buildExportRows = () => {
    return sortedTransactions.map((transaction, index) => {
      const isFirstDateRow =
        index === 0 || sortedTransactions[index - 1].date !== transaction.date;
      return {
      no: index + 1,
      tanggal: formatISODateToLongID(transaction.date),
      jumlahNota: noteCountByDate.get(transaction.id) ?? 0,
      totalKeseluruhan: isFirstDateRow ? dailySubtotalByDate.get(transaction.date) ?? 0 : "",
      noKamar: transaction.roomNumber,
      satuan: transaction.quantityKg,
      harga: transaction.pricePerKg,
      totalHarian: getDailyTotal(transaction),
      keterangan: isFirstDateRow ? transaction.clientName : "",
    };
    });
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const onDownloadCSV = () => {
    const rows = buildExportRows();
    const header = [
      "No",
      "Tanggal",
      "Jumlah Nota",
      "No Kamar",
      "Satuan",
      "Harga",
      "Harga Total Harian",
      "Total Keseluruhan",
      "Keterangan",
    ];
    const csvLines = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.no,
          row.tanggal,
          row.jumlahNota,
          row.noKamar,
          row.satuan,
          row.harga,
          row.totalHarian,
          row.totalKeseluruhan,
          `"${row.keterangan.replace(/"/g, '""')}"`,
        ].join(","),
      ),
      `,,,,,,Keterangan,${printKeterangan}`,
      `,,,,,,Total Bulanan,${monthlyTotal}`,
      `,,,,,,TTD ${username},${formatDateWITA()}`,
    ];
    const blob = new Blob([`\uFEFF${csvLines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    downloadBlob(blob, `laundry-report.csv`);
  };

  const onDownloadXLSX = async () => {
    setIsExportingXlsx(true);
    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet("Laundry Report");

      worksheet.addRow([
        "No",
        "Tanggal",
        "Jumlah Nota",
        "No Kamar",
        "Satuan",
        "Harga",
        "Harga Total Harian",
        "Total Keseluruhan",
        "Keterangan",
      ]);

      buildExportRows().forEach((row) => {
        worksheet.addRow([
          row.no,
          row.tanggal,
          row.jumlahNota,
          row.noKamar,
          row.satuan,
          row.harga,
          row.totalHarian,
          row.totalKeseluruhan,
          row.keterangan,
        ]);
      });

      worksheet.addRow(["", "", "", "", "", "", "", "Keterangan", printKeterangan]);
      worksheet.addRow(["", "", "", "", "", "", "", "Total Bulanan", monthlyTotal]);
      worksheet.addRow(["", "", "", "", "", "", "", `TTD ${username}`, formatDateWITA()]);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `laundry-report.xlsx`);
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
      const canvas = await html2canvas(pdfExportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const pageContentWidthPt = pdfWidth - margin * 2;
      const pageContentHeightPt = pdfHeight - margin * 2;

      const pxPerPt = canvas.width / pageContentWidthPt;
      const pageSliceHeightPx = Math.max(1, Math.floor(pageContentHeightPt * pxPerPt));

      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < canvas.height) {
        const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - offsetY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;

        const sliceContext = sliceCanvas.getContext("2d");
        if (!sliceContext) {
          throw new Error("Failed to create canvas context for PDF slice.");
        }

        // Render each vertical slice once to avoid duplicated rows across pages.
        sliceContext.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx,
        );

        const sliceImgData = sliceCanvas.toDataURL("image/png");
        const sliceHeightPt = (sliceHeightPx * pageContentWidthPt) / canvas.width;

        if (pageIndex > 0) {
          pdf.addPage();
        }
        pdf.addImage(sliceImgData, "PNG", margin, margin, pageContentWidthPt, sliceHeightPt);

        offsetY += sliceHeightPx;
        pageIndex += 1;
      }

      pdf.save(`laundry-report.pdf`);
    } finally {
      setIsSavingPdf(false);
    }
  };

  const performResetAll = async () => {
    if (isDeletingTransaction) {
      return;
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    try {
      setIsDeletingTransaction(true);
      setTransactionError("");
      const resetResponse = await fetch("/api/transactions", {
        method: "DELETE",
        credentials: "include",
      });

      if (!resetResponse.ok) {
        const payload = (await resetResponse.json().catch(() => ({}))) as { error?: string };
        const message = payload.error || "Gagal reset semua data laporan.";
        setTransactionError(message);
        toast.error(message);
        return;
      }

      const listResponse = await fetch("/api/transactions", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (listResponse.ok) {
        const listPayload = (await listResponse.json().catch(() => ({}))) as {
          transactions?: Array<{
            id: string;
            date: string;
            roomNumber: string;
            clientName: string;
            quantityKg: number | string;
            pricePerKg: number | string;
          }>;
        };
        const nextTransactions = (listPayload.transactions ?? []).map((transaction) => ({
          id: transaction.id,
          date: transaction.date,
          roomNumber: transaction.roomNumber,
          clientName: transaction.clientName,
          quantityKg: Number(transaction.quantityKg),
          pricePerKg: Number(transaction.pricePerKg),
        }));
        setTransactionState(nextTransactions);
      } else {
        setTransactionState([]);
      }

      setReportPreferences({
        clientName: "",
        keterangan: "",
        startDate: null,
        endDate: null,
      });
      setReportClientName("");
      setReportKeterangan("");
      setStartDate("");
      setEndDate("");
      setFormDate(today);
      setFormRoomNumber("");
      setFormQuantityKg("1");
      setFormPriceInput("");
      setEditDraft(null);
      setError("");
      toast.success("Semua data laporan berhasil direset.");
    } catch {
      setTransactionError("Gagal reset semua data laporan.");
      toast.error("Gagal reset semua data laporan.");
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  const onResetAll = () => {
    toast.warning("Reset semua data laporan?", {
      description: "Semua transaksi dan preferensi akan dihapus.",
      duration: 8000,
      action: {
        label: "Ya, Reset",
        onClick: performResetAll,
      },
      cancel: {
        label: "Batal",
        onClick: () => {
          toast.info("Reset dibatalkan.");
        },
      },
    });
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="surface-card no-print flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Laundry Dashboard
            </p>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Monthly Report Center
            </h1>
            <p className="text-sm text-slate-600">
              Login sebagai: {username}
              {reportClientName.trim() ? ` | Client: ${reportClientName.trim()}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="btn btn-primary flex w-full items-center justify-center gap-2 px-4 py-2 text-sm md:w-auto"
          >
            <FiLogOut className="text-base" />
            Logout
          </button>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="no-print grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
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
        </motion.section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
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
            <div className="no-print border-b border-slate-200 pb-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                    Tabel Transaksi Harian
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Filter berdasarkan rentang tanggal.
                  </p>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]">
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
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                <button
                  type="button"
                  onClick={onResetAll}
                  className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
                  <FiRefreshCw />
                  Reset Semua
                </button>
                <button
                  type="button"
                  onClick={onPrint}
                  className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600"
                >
                  <FiPrinter />
                  Print
                </button>
                <button
                  type="button"
                  onClick={onSavePdf}
                  disabled={isSavingPdf}
                  className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-60"
                >
                  {isSavingPdf && <Spinner size="sm" className="border-slate-200 border-t-white" />}
                  <FiFileText />
                  {isSavingPdf ? "Saving..." : "Save PDF"}
                </button>
                <button
                  type="button"
                  onClick={onDownloadCSV}
                  className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  <FiDownload />
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={onDownloadXLSX}
                  disabled={isExportingXlsx}
                  className="btn flex w-full items-center justify-center gap-2 whitespace-nowrap bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-60"
                >
                  {isExportingXlsx && <Spinner size="sm" className="border-slate-200 border-t-white" />}
                  <FiGrid />
                  {isExportingXlsx ? "Exporting..." : "Download XLSX"}
                </button>
              </div>
              {isLoadingTransactions && (
                <p className="mt-3 text-xs text-slate-600">Memuat transaksi dari server...</p>
              )}
              {transactionError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {transactionError}
                </p>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 border-b border-slate-200 pb-3">
                <p className="text-base font-semibold text-slate-900 sm:text-lg">
                  {finalReportTitle}
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg">
              {sortedTransactions.length === 0 ? (
                <EmptyState />
              ) : (
              <TransactionsTable
                filteredTransactions={sortedTransactions}
                dailySubtotalByDate={dailySubtotalByDate}
                noteCountByDate={noteCountByDate}
                monthlyTotal={monthlyTotal}
                editDraft={editDraft}
                setEditDraft={setEditDraft}
                startInlineEdit={startInlineEdit}
                  onSaveInlineEdit={onSaveInlineEdit}
                  onDeleteRow={onDeleteRow}
                  parsePriceInput={parsePriceInput}
                  formatPriceInput={formatPriceInput}
                />
              )}
              </div>
            </div>

          <motion.div
            layout
            className="no-print mt-5 rounded-xl bg-slate-900 px-4 py-3 text-right text-white shadow-md"
          >
            <p className="text-sm">Total Bulanan</p>
            <p className="text-xl font-semibold">{formatIDR(monthlyTotal)}</p>
            </motion.div>

          <div className="no-print mt-6 border-t border-slate-300 pt-5 text-right text-sm text-slate-700">
              <p>Nama Client: {reportClientName.trim() || "-"}</p>
              <p>Keterangan: {printKeterangan}</p>
              <p>TTD Pemilik Laundry: {username}</p>
              <p>Tanggal (WITA): {formatDateWITA()}</p>
          </div>
          </motion.div>
        </section>
      </div>

      <div
        aria-hidden="true"
        className="fixed -left-[9999px] top-0"
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
                      textAlign: "left",
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
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px" }}>{index + 1}</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px" }}>
                  {isFirstDateRow ? formatISODateToLongID(transaction.date) : ""}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "right" }}>
                  {noteCountByDate.get(transaction.id) ?? 0}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px" }}>
                  {transaction.roomNumber}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "right" }}>
                  {transaction.quantityKg}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "right" }}>
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
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "right" }}>
                  {isFirstDateRow ? formatIDR(dailySubtotalByDate.get(transaction.date) ?? 0) : ""}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px" }}>
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
