import {
  formatPriceInput,
  mapTransactionRows,
  parsePriceInput,
  sanitizeNumberInput,
} from "@/lib/utils/report-transform";

describe("report-transform utils", () => {
  it("maps API rows into normalized transaction rows", () => {
    const rows = mapTransactionRows([
      {
        id: "tx-1",
        date: "2026-03-15",
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: "2.5",
        pricePerKg: "3000",
      },
    ]);

    expect(rows).toEqual([
      {
        id: "tx-1",
        date: "2026-03-15",
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: 2.5,
        pricePerKg: 3000,
      },
    ]);
  });

  it("sanitizes and parses numeric inputs", () => {
    expect(sanitizeNumberInput("Rp 1.234.567")).toBe("1234567");
    expect(parsePriceInput("Rp 1.234.567")).toBe(1234567);
  });

  it("formats price input with id locale separators", () => {
    expect(formatPriceInput("1234567")).toBe("1.234.567");
  });
});
