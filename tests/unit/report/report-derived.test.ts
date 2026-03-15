import {
  buildReportDerivedData,
  filterTransactions,
  filterTransactionsBySearch,
  getDailySubtotalByDate,
  getFinalReportTitle,
  getNoteCountByDate,
  getPrintKeterangan,
  sortTransactions,
} from "@/lib/utils/report-derived";

const transactions = [
  {
    id: "1",
    date: "2026-03-01",
    roomNumber: "A-10",
    clientName: "Alpha",
    quantityKg: 2,
    pricePerKg: 5000,
  },
  {
    id: "2",
    date: "2026-03-01",
    roomNumber: "A-02",
    clientName: "Beta",
    quantityKg: 1,
    pricePerKg: 5000,
  },
  {
    id: "3",
    date: "2026-03-02",
    roomNumber: "B-01",
    clientName: "Gamma",
    quantityKg: 1.5,
    pricePerKg: 6000,
  },
];

describe("report-derived utils", () => {
  it("filters by inclusive date range", () => {
    const result = filterTransactions(transactions, "2026-03-01", "2026-03-01");
    expect(result.map((tx) => tx.id)).toEqual(["1", "2"]);
  });

  it("sorts by date then quantity then room", () => {
    const result = sortTransactions(transactions);
    expect(result.map((tx) => tx.id)).toEqual(["2", "1", "3"]);
  });

  it("builds note count per row id", () => {
    const sorted = sortTransactions(transactions);
    const noteMap = getNoteCountByDate(sorted);
    expect(noteMap.get("2")).toBe(1);
    expect(noteMap.get("1")).toBe(2);
    expect(noteMap.get("3")).toBe(1);
  });

  it("builds daily subtotal map", () => {
    const sorted = sortTransactions(transactions);
    const subtotalMap = getDailySubtotalByDate(sorted);
    expect(subtotalMap.get("2026-03-01")).toBe(15000);
    expect(subtotalMap.get("2026-03-02")).toBe(9000);
  });

  it("filters by search keyword across fields", () => {
    const sorted = sortTransactions(transactions);
    expect(filterTransactionsBySearch(sorted, "beta").map((tx) => tx.id)).toEqual(["2"]);
    expect(filterTransactionsBySearch(sorted, "B-01").map((tx) => tx.id)).toEqual(["3"]);
  });

  it("builds combined derived report data", () => {
    const result = buildReportDerivedData({
      transactions,
      startDate: "2026-03-01",
      endDate: "2026-03-02",
      searchQuery: "a-",
    });
    expect(result.sortedTransactions.length).toBe(3);
    expect(result.visibleTransactions.map((tx) => tx.id)).toEqual(["2", "1"]);
    expect(result.monthlyTotal).toBe(24000);
  });

  it("formats title and print note helpers", () => {
    expect(getFinalReportTitle("Client A", "2026-03-01", "", "2026-03-01")).toContain("Client A");
    expect(getPrintKeterangan("   ")).toBe("-");
  });
});
