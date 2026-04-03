import { getDailyTotal, getMonthlyTotal } from "@/lib/utils/laundry";
import { formatISODateToLongID, formatMonthYearLabel } from "@/lib/utils/date";
import { LaundryTransaction } from "@/types/laundry";

export function filterTransactions(
  transactions: LaundryTransaction[],
  startDate: string,
  endDate: string,
): LaundryTransaction[] {
  return transactions.filter((transaction) => {
    if (startDate && transaction.date < startDate) {
      return false;
    }
    if (endDate && transaction.date > endDate) {
      return false;
    }
    return true;
  });
}

export function sortTransactions(transactions: LaundryTransaction[]): LaundryTransaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    if (a.quantityKg !== b.quantityKg) {
      return a.quantityKg - b.quantityKg;
    }

    const roomA = Number(a.roomNumber.replace(/[^\d]/g, ""));
    const roomB = Number(b.roomNumber.replace(/[^\d]/g, ""));
    const hasRoomNumA = !Number.isNaN(roomA) && roomA > 0;
    const hasRoomNumB = !Number.isNaN(roomB) && roomB > 0;

    if (hasRoomNumA && hasRoomNumB && roomA !== roomB) {
      return roomA - roomB;
    }
    if (a.roomNumber !== b.roomNumber) {
      return a.roomNumber.localeCompare(b.roomNumber, "id");
    }

    return getDailyTotal(a) - getDailyTotal(b);
  });
}

export function getDailySubtotalByDate(sortedTransactions: LaundryTransaction[]): Map<string, number> {
  const subtotalMap = new Map<string, number>();
  sortedTransactions.forEach((transaction) => {
    subtotalMap.set(
      transaction.date,
      (subtotalMap.get(transaction.date) ?? 0) + getDailyTotal(transaction),
    );
  });
  return subtotalMap;
}

export function getNoteCountByDate(sortedTransactions: LaundryTransaction[]): Map<string, number> {
  const dateCounter = new Map<string, number>();
  const noteMap = new Map<string, number>();
  sortedTransactions.forEach((transaction) => {
    const next = (dateCounter.get(transaction.date) ?? 0) + 1;
    dateCounter.set(transaction.date, next);
    noteMap.set(transaction.id, next);
  });
  return noteMap;
}

export function getFinalReportTitle(
  reportClientName: string,
  selectedMonth: string,
): string {
  return `Laporan ${reportClientName.trim() || "Nama Client"} - ${formatMonthYearLabel(selectedMonth)}`;
}

export function getPrintKeterangan(reportKeterangan: string): string {
  return reportKeterangan.trim() || "-";
}

export function getMonthlyTotalFromTransactions(sortedTransactions: LaundryTransaction[]): number {
  return getMonthlyTotal(sortedTransactions);
}

export function filterTransactionsBySearch(
  transactions: LaundryTransaction[],
  searchQuery: string,
): LaundryTransaction[] {
  const keyword = searchQuery.trim().toLowerCase();
  if (!keyword) {
    return transactions;
  }
  return transactions.filter((transaction) => {
    const tanggal = formatISODateToLongID(transaction.date).toLowerCase();
    return (
      transaction.roomNumber.toLowerCase().includes(keyword) ||
      transaction.clientName.toLowerCase().includes(keyword) ||
      String(transaction.quantityKg).toLowerCase().includes(keyword) ||
      String(transaction.pricePerKg).toLowerCase().includes(keyword) ||
      tanggal.includes(keyword)
    );
  });
}

export function filterTransactionsBySelectedMonth(
  transactions: LaundryTransaction[],
  selectedMonth: string,
): LaundryTransaction[] {
  if (!selectedMonth) {
    return transactions;
  }
  return transactions.filter((transaction) => transaction.date.startsWith(selectedMonth));
}

export function buildReportDerivedData(params: {
  transactions: LaundryTransaction[];
  searchQuery: string;
  visibleLimit: number;
  selectedMonth: string;
}) {
  const monthTransactions = filterTransactionsBySelectedMonth(params.transactions, params.selectedMonth);
  const sortedTransactions = sortTransactions(monthTransactions);
  const monthlyTotal = getMonthlyTotalFromTransactions(sortedTransactions);
  const dailySubtotalByDate = getDailySubtotalByDate(sortedTransactions);
  const noteCountByDate = getNoteCountByDate(sortedTransactions);
  const searchFilteredTransactions = filterTransactionsBySearch(sortedTransactions, params.searchQuery);
  const visibleTransactions = searchFilteredTransactions.slice(0, params.visibleLimit);
  const visibleDailySubtotalByDate = getDailySubtotalByDate(visibleTransactions);
  const visibleNoteCountByDate = getNoteCountByDate(visibleTransactions);

  return {
    sortedTransactions,
    monthlyTotal,
    dailySubtotalByDate,
    noteCountByDate,
    searchFilteredTransactions,
    visibleTransactions,
    visibleDailySubtotalByDate,
    visibleNoteCountByDate,
  };
}
