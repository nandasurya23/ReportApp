import { useMemo } from "react";

import {
  buildReportDerivedData,
  getFinalReportTitle,
  getPrintKeterangan,
} from "@/lib/utils/report-derived";
import { LaundryTransaction } from "@/types/laundry";

interface UseReportDerivedParams {
  transactions: LaundryTransaction[];
  searchQuery: string;
  visibleLimit: number;
  reportClientName: string;
  selectedMonth: string;
  reportKeterangan: string;
}

export function useReportDerived({
  transactions,
  searchQuery,
  visibleLimit,
  reportClientName,
  selectedMonth,
  reportKeterangan,
}: UseReportDerivedParams) {
  const {
    sortedTransactions,
    monthlyTotal,
    dailySubtotalByDate,
    noteCountByDate,
    searchFilteredTransactions,
    visibleTransactions,
    visibleDailySubtotalByDate,
    visibleNoteCountByDate,
  } = useMemo(
    () =>
      buildReportDerivedData({
        transactions,
        searchQuery,
        visibleLimit,
        selectedMonth,
      }),
    [transactions, searchQuery, visibleLimit, selectedMonth],
  );
  const finalReportTitle = getFinalReportTitle(reportClientName, selectedMonth);
  const printKeterangan = getPrintKeterangan(reportKeterangan);

  return {
    sortedTransactions,
    monthlyTotal,
    dailySubtotalByDate,
    noteCountByDate,
    searchFilteredTransactions,
    visibleTransactions,
    visibleDailySubtotalByDate,
    visibleNoteCountByDate,
    finalReportTitle,
    printKeterangan,
  };
}
