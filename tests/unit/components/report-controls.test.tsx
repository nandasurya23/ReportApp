/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/components/report/custom-date-picker", () => ({
  CustomDatePicker: ({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) => (
    <input
      data-testid={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

import { ReportControls } from "@/components/report/report-controls";

const baseProps = {
  startDate: "2026-03-01",
  endDate: "2026-03-31",
  setStartDate: jest.fn(),
  setEndDate: jest.fn(),
  searchQuery: "",
  setSearchQuery: jest.fn(),
  visibleCount: 3,
  totalCount: 10,
  onResetAll: jest.fn(),
  onPrint: jest.fn(),
  onSavePdf: jest.fn(),
  onDownloadCSV: jest.fn(),
  onDownloadXLSX: jest.fn(),
  isSavingPdf: false,
  isExportingXlsx: false,
  isLoadingTransactions: false,
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
    expect(screen.getByRole("button", { name: /reset semua/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download csv/i })).toBeInTheDocument();
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
        isLoadingTransactions
        transactionError="Gagal memuat transaksi dari server."
      />,
    );
    expect(screen.getByText("Memuat transaksi dari server...")).toBeInTheDocument();
    expect(screen.getByText("Gagal memuat transaksi dari server.")).toBeInTheDocument();
  });

  it("disables export buttons in loading states", () => {
    render(<ReportControls {...baseProps} isSavingPdf isExportingXlsx />);
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /exporting/i })).toBeDisabled();
  });
});
