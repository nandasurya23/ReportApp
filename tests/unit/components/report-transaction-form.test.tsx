/** @jest-environment jsdom */

import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("framer-motion", () => ({
  motion: {
    form: ({ children, ...props }: ComponentProps<"form">) => <form {...props}>{children}</form>,
  },
}));

jest.mock("@/components/report/custom-date-picker", () => ({
  CustomDatePicker: ({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) => (
    <input data-testid={id} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

import { ReportTransactionForm } from "@/components/report/report-transaction-form";

const baseProps = {
  onSubmitAdd: jest.fn((event?: { preventDefault?: () => void }) => event?.preventDefault?.()),
  formDate: "2026-03-15",
  setFormDate: jest.fn(),
  formRoomNumber: "A-01",
  setFormRoomNumber: jest.fn(),
  reportClientName: "Client A",
  setReportClientName: jest.fn(),
  reportKeterangan: "Catatan",
  setReportKeterangan: jest.fn(),
  formQuantityKg: "1",
  setFormQuantityKg: jest.fn(),
  formPriceInput: "5.000",
  setFormPriceInput: jest.fn(),
  formatPriceInput: jest.fn((value: string) => value),
  error: "",
  isCreatingTransaction: false,
};

describe("ReportTransactionForm", () => {
  beforeEach(() => {
    Object.values(baseProps).forEach((value) => {
      if (typeof value === "function" && "mockReset" in value) {
        (value as jest.Mock).mockReset();
      }
    });
    baseProps.formatPriceInput.mockImplementation((value: string) => value);
    baseProps.onSubmitAdd.mockImplementation((event?: { preventDefault?: () => void }) => event?.preventDefault?.());
  });

  it("renders main fields and submit button", () => {
    render(<ReportTransactionForm {...baseProps} />);
    expect(screen.getByLabelText(/no kamar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nama client/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tambah/i })).toBeInTheDocument();
  });

  it("handles input changes and submit", () => {
    render(<ReportTransactionForm {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/no kamar/i), { target: { value: "B-02" } });
    expect(baseProps.setFormRoomNumber).toHaveBeenCalledWith("B-02");

    fireEvent.change(screen.getByLabelText(/harga/i), { target: { value: "7000" } });
    expect(baseProps.formatPriceInput).toHaveBeenCalledWith("7000");
    expect(baseProps.setFormPriceInput).toHaveBeenCalledWith("7000");

    fireEvent.submit(screen.getByRole("button", { name: /tambah/i }).closest("form") as HTMLFormElement);
    expect(baseProps.onSubmitAdd).toHaveBeenCalled();
  });

  it("shows error and loading states conditionally", () => {
    render(
      <ReportTransactionForm
        {...baseProps}
        error="No kamar wajib diisi."
        isCreatingTransaction
      />,
    );
    expect(screen.getByText(/no kamar wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /menyimpan/i })).toBeDisabled();
  });
});
