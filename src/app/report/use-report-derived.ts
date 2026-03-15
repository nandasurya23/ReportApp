import { useMemo } from "react";

import {
  buildReportDerivedData,
  getFinalReportTitle,
  getPrintKeterangan,
} from "@/lib/utils/report-derived";
import { LaundryTransaction } from "@/types/laundry";

interface UseReportDerivedParams {
  transactions: LaundryTransaction[];
  startDate: string;
  endDate: string;
  searchQuery: string;
  reportClientName: string;
  formDate: string;
  reportKeterangan: string;
}

export function useReportDerived({
  transactions,
  startDate,
  endDate,
  searchQuery,
  reportClientName,
  formDate,
  reportKeterangan,
}: UseReportDerivedParams) {
  const {
    filteredTransactions,
    sortedTransactions,
    monthlyTotal,
    dailySubtotalByDate,
    noteCountByDate,
    visibleTransactions,
    visibleDailySubtotalByDate,
    visibleNoteCountByDate,
  } = useMemo(
    () =>
      buildReportDerivedData({
        transactions,
        startDate,
        endDate,
        searchQuery,
      }),
    [transactions, startDate, endDate, searchQuery],
  );
  const finalReportTitle = getFinalReportTitle(reportClientName, startDate, endDate, formDate);
  const printKeterangan = getPrintKeterangan(reportKeterangan);

  return {
    filteredTransactions,
    sortedTransactions,
    monthlyTotal,
    dailySubtotalByDate,
    noteCountByDate,
    visibleTransactions,
    visibleDailySubtotalByDate,
    visibleNoteCountByDate,
    finalReportTitle,
    printKeterangan,
  };
}
