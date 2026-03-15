import {
  parsePriceInput,
  parseQuantityInput,
  validateTransactionInput,
} from "@/lib/utils/report-form";

describe("report-form utils", () => {
  it("parses quantity with comma decimal", () => {
    expect(parseQuantityInput("1,5")).toBe(1.5);
  });

  it("parses price by stripping non-digits", () => {
    expect(parsePriceInput("Rp 1.250.000")).toBe(1250000);
  });

  it("returns validation message for missing room number", () => {
    const message = validateTransactionInput({
      date: "2026-03-15",
      roomNumber: "  ",
      keterangan: "catatan",
      quantityKg: 1,
      pricePerKg: 1000,
      reportClientName: "Client A",
    });
    expect(message).toBe("No kamar wajib diisi.");
  });

  it("returns empty string for valid input", () => {
    const message = validateTransactionInput({
      date: "2026-03-15",
      roomNumber: "A-01",
      keterangan: "catatan",
      quantityKg: 1.5,
      pricePerKg: 1000,
      reportClientName: "Client A",
    });
    expect(message).toBe("");
  });
});
