"use client";

import { FormEvent } from "react";
import { toast } from "sonner";

import { setReportPreferences } from "@/lib/storage/local-storage";
import {
  createTransactionRequest,
  deleteTransactionRequest,
  readApiError,
  resetTransactionsRequest,
  updateTransactionRequest,
} from "@/lib/services/report-api";
import {
  parsePriceInput,
  parseQuantityInput,
  validateTransactionInput,
} from "@/lib/utils/report-form";

interface EditDraft {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: string;
  priceInput: string;
}

interface UseReportTransactionsActionsParams {
  fetchTransactionsList: () => Promise<
    | Array<{
        id: string;
        date: string;
        roomNumber: string;
        clientName: string;
        quantityKg: number;
        pricePerKg: number;
      }>
    | null
  >;
  isCreatingTransaction: boolean;
  isUpdatingTransaction: boolean;
  isDeletingTransaction: boolean;
  setIsCreatingTransaction: (value: boolean) => void;
  setIsUpdatingTransaction: (value: boolean) => void;
  setIsDeletingTransaction: (value: boolean) => void;
  setTransactionError: (value: string) => void;
  setTransactionState: (
    value: Array<{
      id: string;
      date: string;
      roomNumber: string;
      clientName: string;
      quantityKg: number;
      pricePerKg: number;
    }>,
  ) => void;
  setError: (value: string) => void;
  reportClientName: string;
  reportKeterangan: string;
  formDate: string;
  formRoomNumber: string;
  formQuantityKg: string;
  formPriceInput: string;
  setReportClientName: (value: string) => void;
  setReportKeterangan: (value: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setFormDate: (value: string) => void;
  setFormRoomNumber: (value: string) => void;
  setFormQuantityKg: (value: string) => void;
  setFormPriceInput: (value: string) => void;
  editDraft: EditDraft | null;
  setEditDraft: React.Dispatch<React.SetStateAction<EditDraft | null>>;
}

export function useReportTransactionsActions({
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
}: UseReportTransactionsActionsParams) {
  const reloadTransactions = async (onFailedMessage: string, fallbackToEmpty = false) => {
    const nextTransactions = await fetchTransactionsList();
    if (nextTransactions) {
      setTransactionState(nextTransactions);
      return;
    }
    if (fallbackToEmpty) {
      setTransactionState([]);
      return;
    }
    setTransactionError(onFailedMessage);
  };

  const onSubmitAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingTransaction) {
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

      await reloadTransactions("Transaksi berhasil ditambah, tapi gagal memuat ulang data.");

      setFormDate(new Date().toISOString().slice(0, 10));
      setFormRoomNumber("");
      setFormQuantityKg("1");
      setFormPriceInput("");
      setError("");
      toast.success("Transaksi baru berhasil ditambahkan.");
    } catch {
      const failedMessage = "Gagal menambahkan transaksi.";
      setError(failedMessage);
      setTransactionError(failedMessage);
      toast.error(failedMessage);
    } finally {
      setIsCreatingTransaction(false);
    }
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
    const message = validateTransactionInput({
      date: editDraft.date,
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
        date: editDraft.date,
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

      await reloadTransactions("Transaksi berhasil diupdate, tapi gagal memuat ulang data.");

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
  };

  const onDeleteRow = async (id: string) => {
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

      await reloadTransactions("Transaksi berhasil dihapus, tapi gagal memuat ulang data.");

      if (editDraft?.id === id) {
        setEditDraft(null);
      }
      toast.success("Transaksi berhasil dihapus.");
    } catch {
      setTransactionError("Gagal menghapus transaksi.");
      toast.error("Gagal menghapus transaksi.");
      toast.error("Gagal menghapus transaksi.");
    } finally {
      setIsDeletingTransaction(false);
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
      const resetResponse = await resetTransactionsRequest();

      if (!resetResponse.ok) {
        const payload = await readApiError(resetResponse);
        const failedMessage = payload.error || "Gagal reset semua data laporan.";
        setTransactionError(failedMessage);
        toast.error(failedMessage);
        return;
      }

      await reloadTransactions("", true);

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

  return {
    onSubmitAdd,
    onSaveInlineEdit,
    onDeleteRow,
    performResetAll,
  };
}
