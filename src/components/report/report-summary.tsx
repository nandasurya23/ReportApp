"use client";

import { motion } from "framer-motion";

import { formatIDR } from "@/lib/utils/currency";
import { formatDateWITA } from "@/lib/utils/date";

interface ReportSummaryProps {
  monthlyTotal: number;
  reportClientName: string;
  printKeterangan: string;
  username: string;
}

export function ReportSummary({
  monthlyTotal,
  reportClientName,
  printKeterangan,
  username,
}: ReportSummaryProps) {
  return (
    <>
      <motion.div
        layout
        className="no-print mt-5 rounded-2xl border border-slate-800/50 bg-[linear-gradient(145deg,#0f172a,#1e293b)] px-5 py-4 text-right text-white shadow-md"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
          Total Bulanan
        </p>
        <p className="mt-1 text-xl font-semibold">{formatIDR(monthlyTotal)}</p>
      </motion.div>

      <div className="no-print mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-right text-sm text-slate-700 shadow-sm">
        <p>Nama Client: {reportClientName.trim() || "-"}</p>
        <p>Keterangan: {printKeterangan}</p>
        <p>TTD Pemilik Laundry: {username}</p>
        <p>Tanggal (WITA): {formatDateWITA()}</p>
      </div>
    </>
  );
}
