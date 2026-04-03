/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";

import { ReportControls } from "@/components/report/report-controls";

const baseProps = {
  selectedMonth: "2026-03",
  selectedMonthLabel: "Maret 2026",
  onSelectedMonthChange: jest.fn(),
  searchQuery: "",
  setSearchQuery: jest.fn(),
  visibleCount: 3,
  totalCount: 10,
  onResetAll: jest.fn(),
  onPrint: jest.fn(),
  onSavePdf: jest.fn(),
  onDownloadXLSX: jest.fn(),
  isSavingPdf: false,
  isExportingXlsx: false,
  loadedCount: 100,
  totalAvailable: 286,
  hasMoreTransactions: true,
  onLoadMoreTransactions: jest.fn(),
  isLoadingMoreTransactions: false,
  isMonthLoading: false,
  canExport: true,
  transactionError: "",
};

describe("ReportControls", () => {
  beforeEach(() => {
    Object.values(baseProps).forEach((value) => {
      if (typeof value === "function" && "mockReset" in value) {
        (value as jest.Mock).mockReset();
      }
    });
  });

  it("renders counter badges and action buttons", () => {
    render(<ReportControls {...baseProps} />);
    expect(screen.getByText("3 tampil")).toBeInTheDocument();
    expect(screen.getByText("10 total")).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 100 dari 286 baris bulan aktif")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /maret 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset semua/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /muat baris berikutnya/i })).toBeInTheDocument();
  });

  it("updates search query and triggers handlers", () => {
    render(<ReportControls {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText(/cari tanggal/i), {
      target: { value: "alpha" },
    });
    expect(baseProps.setSearchQuery).toHaveBeenCalledWith("alpha");

    fireEvent.click(screen.getByRole("button", { name: /print/i }));
    expect(baseProps.onPrint).toHaveBeenCalledTimes(1);
  });

  it("shows loading and error states conditionally", () => {
    render(
      <ReportControls
        {...baseProps}
        isMonthLoading
        transactionError="Gagal memuat transaksi dari server."
      />,
    );
    expect(screen.getByText("Memuat bulan aktif...")).toBeInTheDocument();
    expect(screen.getByText("Gagal memuat transaksi dari server.")).toBeInTheDocument();
  });

  it("disables export buttons in loading states", () => {
    render(<ReportControls {...baseProps} isSavingPdf isExportingXlsx canExport={false} />);
    expect(screen.getByRole("button", { name: /menyiapkan pdf/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /menyiapkan xlsx/i })).toBeDisabled();
  });
});
