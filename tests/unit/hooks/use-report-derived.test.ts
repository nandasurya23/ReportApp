jest.mock("react", () => ({
  useMemo: (factory: () => unknown) => factory(),
}));

import { useReportDerived } from "@/app/report/use-report-derived";

const transactions = [
  {
    id: "t1",
    date: "2026-03-01",
    roomNumber: "A-10",
    clientName: "Alpha",
    quantityKg: 2,
    pricePerKg: 5000,
  },
  {
    id: "t2",
    date: "2026-03-01",
    roomNumber: "A-02",
    clientName: "Beta",
    quantityKg: 1,
    pricePerKg: 5000,
  },
  {
    id: "t3",
    date: "2026-03-02",
    roomNumber: "B-01",
    clientName: "Gamma",
    quantityKg: 1.5,
    pricePerKg: 6000,
  },
  {
    id: "t4",
    date: "2026-04-01",
    roomNumber: "C-01",
    clientName: "Delta",
    quantityKg: 1,
    pricePerKg: 7000,
  },
];

describe("useReportDerived", () => {
  it("applies date filter and sorting deterministically", () => {
    const result = useReportDerived({
      transactions,
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      searchQuery: "",
      reportClientName: "Client A",
      formDate: "2026-03-15",
      reportKeterangan: "Catatan",
    });

    expect(result.sortedTransactions.map((tx) => tx.id)).toEqual(["t2", "t1", "t3"]);
  });

  it("applies search logic on sorted transactions", () => {
    const result = useReportDerived({
      transactions,
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      searchQuery: "beta",
      reportClientName: "Client A",
      formDate: "2026-03-15",
      reportKeterangan: "Catatan",
    });

    expect(result.visibleTransactions.map((tx) => tx.id)).toEqual(["t2"]);
  });

  it("calculates monthly total, subtotals, and note counts", () => {
    const result = useReportDerived({
      transactions,
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      searchQuery: "",
      reportClientName: "Client A",
      formDate: "2026-03-15",
      reportKeterangan: "Catatan",
    });

    expect(result.monthlyTotal).toBe(24000);
    expect(result.dailySubtotalByDate.get("2026-03-01")).toBe(15000);
    expect(result.dailySubtotalByDate.get("2026-03-02")).toBe(9000);
    expect(result.noteCountByDate.get("t2")).toBe(1);
    expect(result.noteCountByDate.get("t1")).toBe(2);
    expect(result.noteCountByDate.get("t3")).toBe(1);
  });

  it("returns visible maps based on filtered search results", () => {
    const result = useReportDerived({
      transactions,
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      searchQuery: "a-",
      reportClientName: "Client A",
      formDate: "2026-03-15",
      reportKeterangan: "Catatan",
    });

    expect(result.visibleTransactions.map((tx) => tx.id)).toEqual(["t2", "t1"]);
    expect(result.visibleDailySubtotalByDate.get("2026-03-01")).toBe(15000);
    expect(result.visibleNoteCountByDate.get("t2")).toBe(1);
    expect(result.visibleNoteCountByDate.get("t1")).toBe(2);
  });
});
