const toastErrorMock = jest.fn();
const toastSuccessMock = jest.fn();

const createTransactionRequestMock = jest.fn();
const updateTransactionRequestMock = jest.fn();
const deleteTransactionRequestMock = jest.fn();
const resetTransactionsRequestMock = jest.fn();
const readApiErrorMock = jest.fn();
const safeJsonMock = jest.fn();

jest.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

jest.mock("@/lib/services/report-api", () => ({
  createTransactionRequest: (...args: unknown[]) => createTransactionRequestMock(...args),
  updateTransactionRequest: (...args: unknown[]) => updateTransactionRequestMock(...args),
  deleteTransactionRequest: (...args: unknown[]) => deleteTransactionRequestMock(...args),
  resetTransactionsRequest: (...args: unknown[]) => resetTransactionsRequestMock(...args),
  readApiError: (...args: unknown[]) => readApiErrorMock(...args),
}));

jest.mock("@/lib/utils/http", () => ({
  safeJson: (...args: unknown[]) => safeJsonMock(...args),
}));

import { useReportTransactionsActions } from "@/app/report/use-report-transactions-actions";

describe("useReportTransactionsActions", () => {
  const baseParams = () => ({
    fetchTransactionsList: jest.fn(),
    isCreatingTransaction: false,
    isUpdatingTransaction: false,
    isDeletingTransaction: false,
    setIsCreatingTransaction: jest.fn(),
    setIsUpdatingTransaction: jest.fn(),
    setIsDeletingTransaction: jest.fn(),
    setTransactionError: jest.fn(),
    setTransactionState: jest.fn(),
    setError: jest.fn(),
    reportClientName: "Client A",
    reportKeterangan: "Catatan",
    formDate: "2026-03-15",
    formRoomNumber: "A-01",
    formQuantityKg: "2",
    formPriceInput: "5.000",
    setReportClientName: jest.fn(),
    setReportKeterangan: jest.fn(),
    setStartDate: jest.fn(),
    setEndDate: jest.fn(),
    setFormDate: jest.fn(),
    setFormRoomNumber: jest.fn(),
    setFormQuantityKg: jest.fn(),
    setFormPriceInput: jest.fn(),
    editDraft: null as {
      id: string;
      date: string;
      roomNumber: string;
      clientName: string;
      quantityKg: string;
      priceInput: string;
    } | null,
    setEditDraft: jest.fn(),
  });

  beforeEach(() => {
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    createTransactionRequestMock.mockReset();
    updateTransactionRequestMock.mockReset();
    deleteTransactionRequestMock.mockReset();
    resetTransactionsRequestMock.mockReset();
    readApiErrorMock.mockReset();
    safeJsonMock.mockReset();
  });

  it("creates transaction and patches local state from response payload", async () => {
    const params = baseParams();
    createTransactionRequestMock.mockResolvedValue({ ok: true });
    safeJsonMock.mockResolvedValue({
      transaction: {
        id: "t-new",
        date: "2026-03-15",
        roomNumber: "A-01",
        clientName: "Catatan",
        quantityKg: 2,
        pricePerKg: 5000,
      },
    });

    const { onSubmitAdd } = useReportTransactionsActions(params);
    const preventDefault = jest.fn();
    await onSubmitAdd({ preventDefault } as unknown as React.FormEvent<HTMLFormElement>);

    expect(preventDefault).toHaveBeenCalled();
    expect(createTransactionRequestMock).toHaveBeenCalled();
    expect(params.setTransactionState).toHaveBeenCalledWith(expect.any(Function));
    expect(params.setIsCreatingTransaction).toHaveBeenNthCalledWith(1, true);
    expect(params.setIsCreatingTransaction).toHaveBeenLastCalledWith(false);
    expect(toastSuccessMock).toHaveBeenCalledWith("Transaksi baru berhasil ditambahkan.");
  });

  it("updates transaction and patches state when payload exists", async () => {
    const params = baseParams();
    params.editDraft = {
      id: "t-1",
      date: "2026-03-15",
      roomNumber: "A-02",
      clientName: "Catatan",
      quantityKg: "2",
      priceInput: "5.000",
    };
    updateTransactionRequestMock.mockResolvedValue({ ok: true });
    safeJsonMock.mockResolvedValue({
      transaction: {
        id: "t-1",
        date: "2026-03-15",
        roomNumber: "A-02",
        clientName: "Catatan",
        quantityKg: 2,
        pricePerKg: 5000,
      },
    });

    const { onSaveInlineEdit } = useReportTransactionsActions(params);
    await onSaveInlineEdit();

    expect(updateTransactionRequestMock).toHaveBeenCalled();
    expect(params.setTransactionState).toHaveBeenCalledWith(expect.any(Function));
    expect(params.setEditDraft).toHaveBeenCalledWith(null);
    expect(toastSuccessMock).toHaveBeenCalledWith("Perubahan transaksi berhasil disimpan.");
  });

  it("deletes transaction and removes row locally", async () => {
    const params = baseParams();
    deleteTransactionRequestMock.mockResolvedValue({ ok: true });

    const { onDeleteRow } = useReportTransactionsActions(params);
    await onDeleteRow("t-1");

    expect(deleteTransactionRequestMock).toHaveBeenCalledWith("t-1");
    expect(params.setTransactionState).toHaveBeenCalledWith(expect.any(Function));
    expect(toastSuccessMock).toHaveBeenCalledWith("Transaksi berhasil dihapus.");
  });
});
