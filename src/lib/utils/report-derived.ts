import { getDailyTotal, getMonthlyTotal } from "@/lib/utils/laundry";
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
  startDate: string,
  endDate: string,
  formDate: string,
): string {
  const activeDateContext = startDate || endDate || formDate;
  const activeDate = new Date(`${activeDateContext}T00:00:00`);
  const activeMonthYear = Number.isNaN(activeDate.getTime())
    ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date())
    : new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(activeDate);
  return `Laporan ${reportClientName.trim() || "Nama Client"} - ${activeMonthYear}`;
}

export function getPrintKeterangan(reportKeterangan: string): string {
  return reportKeterangan.trim() || "-";
}

export function getMonthlyTotalFromTransactions(sortedTransactions: LaundryTransaction[]): number {
  return getMonthlyTotal(sortedTransactions);
}
