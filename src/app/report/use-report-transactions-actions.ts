"use client";

import { FormEvent, useCallback, useRef } from "react";
import { toast } from "sonner";

import { setReportPreferences } from "@/lib/storage/local-storage";
import {
  createTransactionRequest,
  deleteTransactionsByMonthRequest,
  deleteTransactionRequest,
  readApiError,
  resetTransactionsRequest,
  updateTransactionRequest,
} from "@/lib/services/report-api";
import { safeJson } from "@/lib/utils/http";
import {
  parsePriceInput,
  parseQuantityInput,
  validateTransactionInput,
} from "@/lib/utils/report-form";
import { mapTransactionRows } from "@/lib/utils/report-transform";

interface EditDraft {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: string;
  priceInput: string;
}

type TransactionRow = {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: number;
  pricePerKg: number;
};

interface UseReportTransactionsActionsParams {
  reloadActiveMonthData: () => Promise<void>;
  isCreatingTransaction: boolean;
  isUpdatingTransaction: boolean;
  isDeletingTransaction: boolean;
  setIsCreatingTransaction: (value: boolean) => void;
  setIsUpdatingTransaction: (value: boolean) => void;
  setIsDeletingTransaction: (value: boolean) => void;
  setTransactionError: (value: string) => void;
  setTransactionState: (value: TransactionRow[] | ((prev: TransactionRow[]) => TransactionRow[])) => void;
  setVisibleLimit: (value: number | ((prev: number) => number)) => void;
  setError: (value: string) => void;
  reportClientName: string;
  reportKeterangan: string;
  formDate: string;
  formRoomNumber: string;
  formQuantityKg: string;
  formPriceInput: string;
  setReportClientName: (value: string) => void;
  setReportKeterangan: (value: string) => void;
  setFormDate: (value: string) => void;
  setFormRoomNumber: (value: string) => void;
  setFormQuantityKg: (value: string) => void;
  setFormPriceInput: (value: string) => void;
  editDraft: EditDraft | null;
  setEditDraft: React.Dispatch<React.SetStateAction<EditDraft | null>>;
  selectedMonth: string;
}

export function useReportTransactionsActions({
  reloadActiveMonthData,
  isCreatingTransaction,
  isUpdatingTransaction,
  isDeletingTransaction,
  setIsCreatingTransaction,
  setIsUpdatingTransaction,
  setIsDeletingTransaction,
  setTransactionError,
  setTransactionState,
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
  selectedMonth,
}: UseReportTransactionsActionsParams) {
  const createInFlightRef = useRef(false);

  const mapTransactionFromPayload = useCallback((payload: unknown) => {
    const raw = (payload as { transaction?: unknown })?.transaction;
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const mapped = mapTransactionRows([raw as never]);
    return mapped[0] ?? null;
  }, []);

  const onSubmitAdd = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingTransaction || createInFlightRef.current) {
      return;
    }

    const keterangan = reportKeterangan.trim();
    const quantityKg = parseQuantityInput(formQuantityKg);
    const pricePerKg = parsePriceInput(formPriceInput);
    const message = validateTransactionInput({
      date: formDate,
      roomNumber: formRoomNumber,
      keterangan,
      quantityKg,
      pricePerKg,
      reportClientName,
    });
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }

    try {
      createInFlightRef.current = true;
      setIsCreatingTransaction(true);
      setTransactionError("");
      const createResponse = await createTransactionRequest({
        date: formDate,
        roomNumber: formRoomNumber.trim(),
        clientName: keterangan,
        quantityKg,
        pricePerKg,
      });

      if (!createResponse.ok) {
        const payload = await readApiError(createResponse);
        const failedMessage = payload.error || "Gagal menambahkan transaksi.";
        setError(failedMessage);
        setTransactionError(failedMessage);
        toast.error(failedMessage);
        return;
      }

      const payload = await safeJson(createResponse, {} as { transaction?: unknown });
      const createdTransaction = mapTransactionFromPayload(payload);
      if (createdTransaction) {
        setTransactionState((prev) => {
          const exists = prev.some((item) => item.id === createdTransaction.id);
          if (exists) {
            return prev.map((item) => (item.id === createdTransaction.id ? createdTransaction : item));
          }
          return [...prev, createdTransaction];
        });
      } else {
        await reloadActiveMonthData();
      }

      setVisibleLimit((prev) => prev + 1);

      setFormDate(new Date().toISOString().slice(0, 10));
      setFormRoomNumber("");
      setFormQuantityKg("1");
      setFormPriceInput("15.000");
      setError("");
      toast.success("Transaksi baru berhasil ditambahkan.");
    } catch {
      const failedMessage = "Gagal menambahkan transaksi.";
      setError(failedMessage);
      setTransactionError(failedMessage);
      toast.error(failedMessage);
    } finally {
      createInFlightRef.current = false;
      setIsCreatingTransaction(false);
    }
  }, [
    formDate,
    formPriceInput,
    formQuantityKg,
    formRoomNumber,
    isCreatingTransaction,
    mapTransactionFromPayload,
    reportClientName,
    reportKeterangan,
    setError,
    setFormDate,
    setFormPriceInput,
    setFormQuantityKg,
    setFormRoomNumber,
    setIsCreatingTransaction,
    setReportClientName,
    setReportKeterangan,
    setTransactionError,
    setTransactionState,
    setVisibleLimit,
    reloadActiveMonthData,
  ]);

  const onSaveInlineEdit = useCallback(async () => {
    if (!editDraft) {
      return;
    }
    if (isUpdatingTransaction) {
      return;
    }

    const normalizedDate = editDraft.date.trim();
    const quantityKg = parseQuantityInput(editDraft.quantityKg);
    const pricePerKg = parsePriceInput(editDraft.priceInput);
    const message = validateTransactionInput({
      date: normalizedDate,
      roomNumber: editDraft.roomNumber,
      keterangan: editDraft.clientName,
      quantityKg,
      pricePerKg,
      reportClientName,
    });
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setIsUpdatingTransaction(true);
      setTransactionError("");
      const updateResponse = await updateTransactionRequest(editDraft.id, {
        date: normalizedDate,
        roomNumber: editDraft.roomNumber.trim(),
        clientName: editDraft.clientName.trim(),
        quantityKg,
        pricePerKg,
      });

      if (!updateResponse.ok) {
        const payload = await readApiError(updateResponse);
        const failedMessage = payload.error || "Gagal memperbarui transaksi.";
        setError(failedMessage);
        setTransactionError(failedMessage);
        toast.error(failedMessage);
        return;
      }

      const payload = await safeJson(updateResponse, {} as { transaction?: unknown });
      const updatedTransaction = mapTransactionFromPayload(payload);
      if (updatedTransaction) {
        setTransactionState((prev) => {
          if (!prev.some((item) => item.id === updatedTransaction.id)) {
            return prev;
          }
          return prev.map((item) => (item.id === updatedTransaction.id ? updatedTransaction : item));
        });
      } else {
        await reloadActiveMonthData();
      }

      setVisibleLimit((prev) => prev + 1);

      setEditDraft(null);
      setError("");
      toast.success("Perubahan transaksi berhasil disimpan.");
    } catch {
      const failedMessage = "Gagal memperbarui transaksi.";
      setError(failedMessage);
      setTransactionError(failedMessage);
      toast.error(failedMessage);
    } finally {
      setIsUpdatingTransaction(false);
    }
  }, [
    editDraft,
    isUpdatingTransaction,
    mapTransactionFromPayload,
    reloadActiveMonthData,
    reportClientName,
    setEditDraft,
    setError,
    setIsUpdatingTransaction,
    setTransactionError,
    setTransactionState,
    setVisibleLimit,
  ]);

  const onDeleteRow = useCallback(async (id: string) => {
    if (isDeletingTransaction) {
      return;
    }
    try {
      setIsDeletingTransaction(true);
      setTransactionError("");
      const deleteResponse = await deleteTransactionRequest(id);

      if (!deleteResponse.ok) {
        const payload = await readApiError(deleteResponse);
        const failedMessage = payload.error || "Gagal menghapus transaksi.";
        setTransactionError(failedMessage);
        toast.error(failedMessage);
        return;
      }

      setTransactionState((prev) => prev.filter((item) => item.id !== id));

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
  }, [editDraft?.id, isDeletingTransaction, setEditDraft, setIsDeletingTransaction, setTransactionError, setTransactionState]);

  const performResetAll = useCallback(async () => {
    if (isDeletingTransaction) {
      return;
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    try {
      setIsDeletingTransaction(true);
      setTransactionError("");
      const resetResponse = await resetTransactionsRequest();

      if (!resetResponse.ok) {
        const payload = await readApiError(resetResponse);
        const failedMessage = payload.error || "Gagal reset semua data laporan.";
        setTransactionError(failedMessage);
        toast.error(failedMessage);
        return;
      }

      await reloadActiveMonthData();

      setReportPreferences({
        clientName: "",
        keterangan: "",
        startDate: null,
        endDate: null,
      });
      setReportClientName("");
      setReportKeterangan("");
      setFormDate(today);
      setFormRoomNumber("");
      setFormQuantityKg("1");
      setFormPriceInput("15.000");
      setEditDraft(null);
      setError("");
      toast.success("Semua data laporan berhasil direset.");
    } catch {
      setTransactionError("Gagal reset semua data laporan.");
      toast.error("Gagal reset semua data laporan.");
    } finally {
      setIsDeletingTransaction(false);
    }
  }, [
    isDeletingTransaction,
    reloadActiveMonthData,
    setEditDraft,
    setError,
    setFormDate,
    setFormPriceInput,
    setFormQuantityKg,
    setFormRoomNumber,
    setIsDeletingTransaction,
    setReportClientName,
    setReportKeterangan,
    setTransactionError,
  ]);

  const performResetCurrentMonth = useCallback(async () => {
    if (isDeletingTransaction) {
      return;
    }

    try {
      setIsDeletingTransaction(true);
      setTransactionError("");
      const resetResponse = await deleteTransactionsByMonthRequest(selectedMonth);

      if (!resetResponse.ok) {
        const payload = await readApiError(resetResponse);
        const failedMessage = payload.error || "Gagal menghapus data bulan ini.";
        setTransactionError(failedMessage);
        toast.error(failedMessage);
        return;
      }

      await reloadActiveMonthData();
      setEditDraft(null);
      setError("");
      toast.success("Data bulan aktif berhasil dihapus.");
    } catch {
      setTransactionError("Gagal menghapus data bulan ini.");
      toast.error("Gagal menghapus data bulan ini.");
    } finally {
      setIsDeletingTransaction(false);
    }
  }, [
    isDeletingTransaction,
    reloadActiveMonthData,
    selectedMonth,
    setEditDraft,
    setError,
    setIsDeletingTransaction,
    setTransactionError,
  ]);

  return {
    onSubmitAdd,
    onSaveInlineEdit,
    onDeleteRow,
    performResetAll,
    performResetCurrentMonth,
  };
}
