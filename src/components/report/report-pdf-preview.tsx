"use client";

import { RefObject } from "react";

import { formatIDR } from "@/lib/utils/currency";
import { formatISODateToLongID } from "@/lib/utils/date";
import { getDailyTotal } from "@/lib/utils/laundry";
import { LaundryTransaction } from "@/types/laundry";

interface ReportPdfPreviewProps {
  pdfExportRef: RefObject<HTMLDivElement | null>;
  finalReportTitle: string;
  startDate: string;
  endDate: string;
  sortedTransactions: LaundryTransaction[];
  noteCountByDate: Map<string, number>;
  dailySubtotalByDate: Map<string, number>;
  monthlyTotal: number;
}

export function ReportPdfPreview({
  pdfExportRef,
  finalReportTitle,
  startDate,
  endDate,
  sortedTransactions,
  noteCountByDate,
  dailySubtotalByDate,
  monthlyTotal,
}: ReportPdfPreviewProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed -left-2499.75 top-0"
      ref={pdfExportRef}
      style={{
        width: "794px",
        background: "#ffffff",
        color: "#0f172a",
        padding: "26px",
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      <div
        style={{
          marginBottom: "14px",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "12px 14px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700 }}>{finalReportTitle}</h2>
        <p style={{ margin: "7px 0 0", fontSize: "12px", color: "#475569" }}>
          Periode: {startDate || "-"} s/d {endDate || "-"}
        </p>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: "12px",
          color: "#0f172a",
        }}
      >
        <thead>
          <tr style={{ background: "#e2e8f0" }}>
            {[
              "Nomer",
              "Tanggal tahun bulan",
              "Jumlah Nota",
              "No Kamar",
              "Satuan",
              "Harga",
              "Harga Total Harian",
              "Total Keseluruhan",
              "Keterangan",
            ].map((head) => (
              <th
                key={head}
                style={{
                  border: "1px solid #cbd5e1",
                  padding: "8px 7px",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((transaction, index) => {
            const isFirstDateRow =
              index === 0 || sortedTransactions[index - 1].date !== transaction.date;
            return (
              <tr key={transaction.id}>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {isFirstDateRow ? formatISODateToLongID(transaction.date) : ""}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {noteCountByDate.get(transaction.id) ?? 0}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {transaction.roomNumber}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {transaction.quantityKg}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {formatIDR(transaction.pricePerKg)}
                </td>
                <td
                  style={{
                    border: "1px solid #cbd5e1",
                    padding: "7px 7px",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {formatIDR(getDailyTotal(transaction))}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {isFirstDateRow ? formatIDR(dailySubtotalByDate.get(transaction.date) ?? 0) : ""}
                </td>
                <td style={{ border: "1px solid #cbd5e1", padding: "7px 7px", textAlign: "center" }}>
                  {isFirstDateRow ? transaction.clientName : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div
        style={{
          marginTop: "10px",
          border: "1px solid #cbd5e1",
          background: "#e2e8f0",
          padding: "8px 10px",
          textAlign: "right",
        }}
      >
        <p style={{ margin: 0, fontSize: "11px", fontWeight: 600 }}>Total Bulanan</p>
        <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 700 }}>{formatIDR(monthlyTotal)}</p>
      </div>
    </div>
  );
}
