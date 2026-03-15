import {
  compactText,
  parseDate,
  toTransactionResponse,
} from "@/app/api/transactions/shared";

describe("transactions shared helpers", () => {
  it("compacts text by trimming and collapsing spaces", () => {
    expect(compactText("  kamar   A-01  ")).toBe("kamar A-01");
  });

  it("parses valid date and rejects invalid date", () => {
    const valid = parseDate("2026-03-15");
    expect(valid).toBeInstanceOf(Date);
    expect(valid?.toISOString()).toBe("2026-03-15T00:00:00.000Z");

    expect(parseDate("")).toBeNull();
    expect(parseDate("invalid")).toBeNull();
  });

  it("maps transaction entity to response shape", () => {
    const response = toTransactionResponse({
      id: "tx-1",
      date: new Date("2026-03-15T00:00:00.000Z"),
      roomNumber: "A-01",
      clientName: "Client A",
      quantityKg: 2.5,
      pricePerKg: 5000,
      createdAt: new Date("2026-03-15T01:00:00.000Z"),
      updatedAt: new Date("2026-03-15T02:00:00.000Z"),
    });

    expect(response).toEqual({
      id: "tx-1",
      date: "2026-03-15",
      roomNumber: "A-01",
      clientName: "Client A",
      quantityKg: 2.5,
      pricePerKg: 5000,
      createdAt: "2026-03-15T01:00:00.000Z",
      updatedAt: "2026-03-15T02:00:00.000Z",
    });
  });
});
