import {
  createTransaction,
  getDailyTotal,
  getMonthlyTotal,
  getMonthlyTransactions,
  withDailyTotal,
} from "@/lib/utils/laundry";

describe("laundry utils", () => {
  it("creates transaction with trimmed fields", () => {
    const uuidSpy = jest.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("tx-id-1");
    const transaction = createTransaction({
      date: "2026-03-15",
      roomNumber: " A-01 ",
      clientName: " Client A ",
      quantityKg: 2,
      pricePerKg: 5000,
    });
    expect(transaction).toEqual({
      id: "tx-id-1",
      date: "2026-03-15",
      roomNumber: "A-01",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 5000,
    });
    uuidSpy.mockRestore();
  });

  it("computes daily total", () => {
    expect(
      getDailyTotal({
        id: "1",
        date: "2026-03-15",
        roomNumber: "A-01",
        clientName: "Client A",
        quantityKg: 1.5,
        pricePerKg: 4000,
      }),
    ).toBe(6000);
  });

  it("adds daily total field", () => {
    const result = withDailyTotal({
      id: "1",
      date: "2026-03-15",
      roomNumber: "A-01",
      clientName: "Client A",
      quantityKg: 2,
      pricePerKg: 3000,
    });
    expect(result.dailyTotal).toBe(6000);
  });

  it("filters monthly transactions and computes monthly total", () => {
    const data = [
      { id: "1", date: "2026-03-01", roomNumber: "A", clientName: "A", quantityKg: 1, pricePerKg: 1000 },
      { id: "2", date: "2026-03-20", roomNumber: "B", clientName: "B", quantityKg: 2, pricePerKg: 1000 },
      { id: "3", date: "2026-04-01", roomNumber: "C", clientName: "C", quantityKg: 3, pricePerKg: 1000 },
    ];
    const monthly = getMonthlyTransactions(data, { year: 2026, month: 3 });
    expect(monthly.map((item) => item.id)).toEqual(["1", "2"]);
    expect(getMonthlyTotal(monthly)).toBe(3000);
  });
});
