"use client";

import { useMemo } from "react";

import {
  filterTransactions,
  getDailySubtotalByDate,
  getFinalReportTitle,
  getMonthlyTotalFromTransactions,
  getNoteCountByDate,
  getPrintKeterangan,
  sortTransactions,
} from "@/lib/utils/report-derived";
import { LaundryTransaction } from "@/types/laundry";

interface UseReportDerivedParams {
  transactions: LaundryTransaction[];
  startDate: string;
  endDate: string;
  reportClientName: string;
  formDate: string;
  reportKeterangan: string;
}

export function useReportDerived({
  transactions,
  startDate,
  endDate,
  reportClientName,
  formDate,
  reportKeterangan,
}: UseReportDerivedParams) {
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, startDate, endDate);
  }, [transactions, startDate, endDate]);

  const sortedTransactions = useMemo(() => {
    return sortTransactions(filteredTransactions);
  }, [filteredTransactions]);

  const monthlyTotal = useMemo(() => {
    return getMonthlyTotalFromTransactions(sortedTransactions);
  }, [sortedTransactions]);

  const dailySubtotalByDate = useMemo(() => {
    return getDailySubtotalByDate(sortedTransactions);
  }, [sortedTransactions]);

  const noteCountByDate = useMemo(() => {
    return getNoteCountByDate(sortedTransactions);
  }, [sortedTransactions]);

  const finalReportTitle = getFinalReportTitle(reportClientName, startDate, endDate, formDate);
  const printKeterangan = getPrintKeterangan(reportKeterangan);

  return {
    filteredTransactions,
    sortedTransactions,
    monthlyTotal,
    dailySubtotalByDate,
    noteCountByDate,
    finalReportTitle,
    printKeterangan,
  };
}
