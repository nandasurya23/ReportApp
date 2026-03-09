"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiEdit2, FiSave, FiTrash2, FiX } from "react-icons/fi";

import { formatIDR } from "@/lib/utils/currency";
import { formatISODateToLongID } from "@/lib/utils/date";
import { getDailyTotal } from "@/lib/utils/laundry";
import { LaundryTransaction } from "@/types/laundry";

interface EditDraft {
  id: string;
  date: string;
  roomNumber: string;
  clientName: string;
  quantityKg: string;
  priceInput: string;
}

interface TransactionsTableProps {
  filteredTransactions: LaundryTransaction[];
  dailySubtotalByDate: Map<string, number>;
  noteCountByDate: Map<string, number>;
  monthlyTotal: number;
  editDraft: EditDraft | null;
  setEditDraft: React.Dispatch<React.SetStateAction<EditDraft | null>>;
  startInlineEdit: (transaction: LaundryTransaction) => void;
  onSaveInlineEdit: () => void;
  onDeleteRow: (id: string) => void;
  parsePriceInput: (raw: string) => number;
  formatPriceInput: (raw: string) => string;
}

export function TransactionsTable({
  filteredTransactions,
  dailySubtotalByDate,
  noteCountByDate,
  monthlyTotal,
  editDraft,
  setEditDraft,
  startInlineEdit,
  onSaveInlineEdit,
  onDeleteRow,
  parsePriceInput,
  formatPriceInput,
}: TransactionsTableProps) {
  return (
    <table className="report-table min-w-[1160px] border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700">
      <colgroup>
        <col className="w-[70px]" />
        <col className="w-[180px]" />
        <col className="w-[100px]" />
        <col className="w-[110px]" />
        <col className="w-[90px]" />
        <col className="w-[140px]" />
        <col className="w-[170px]" />
        <col className="w-[170px]" />
        <col className="w-auto" />
        <col className="w-[126px]" />
      </colgroup>
      <thead>
        <tr className="sticky top-0 z-10 bg-slate-50 text-left text-slate-600">
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide">
            Nomer
          </th>
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide">
            Tanggal
          </th>
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-right">
            Jumlah Nota
          </th>
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide">No Kamar</th>
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-right">Satuan</th>
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-right">Harga</th>
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-right">
            Harga Total Harian
          </th>
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-right">
            Total Keseluruhan
          </th>
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide">
            Keterangan
          </th>
          <th className="border-b border-slate-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-center">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        <AnimatePresence initial={false}>
          {filteredTransactions.map((transaction, index) => {
            const isEditing = editDraft?.id === transaction.id;
            const isFirstDateRow =
              index === 0 || filteredTransactions[index - 1].date !== transaction.date;
            const rowTotal = isEditing
              ? Number(editDraft.quantityKg || "0") * parsePriceInput(editDraft.priceInput)
              : getDailyTotal(transaction);

            return (
              <motion.tr
                key={transaction.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={`transition-colors ${
                  isEditing
                    ? "bg-amber-50 ring-1 ring-inset ring-amber-300"
                    : "bg-white odd:bg-slate-50/50 hover:bg-slate-50"
                } text-slate-900`}
              >
                <td className="border-b border-slate-200 px-3 py-2.5 align-top">{index + 1}</td>
                <td className="border-b border-slate-200 px-3 py-2.5 align-top">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editDraft.date}
                      onChange={(event) =>
                        setEditDraft((prev) =>
                          prev ? { ...prev, date: event.target.value } : prev,
                        )
                      }
                      className="input-field max-w-[170px] px-2 py-1"
                    />
                  ) : (
                    isFirstDateRow ? formatISODateToLongID(transaction.date) : ""
                  )}
                </td>
                <td className="border-b border-slate-200 px-3 py-2.5 text-right align-top">
                  {noteCountByDate.get(transaction.date) ?? 0}
                </td>
                <td className="border-b border-slate-200 px-3 py-2.5 align-top">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDraft.roomNumber}
                      onChange={(event) =>
                        setEditDraft((prev) =>
                          prev ? { ...prev, roomNumber: event.target.value } : prev,
                        )
                      }
                      className="input-field max-w-[130px] px-2 py-1"
                    />
                  ) : (
                    transaction.roomNumber
                  )}
                </td>
                <td className="border-b border-slate-200 px-3 py-2.5 text-right align-top">
                  {isEditing ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editDraft.quantityKg}
                      onChange={(event) =>
                        setEditDraft((prev) => {
                          if (!prev) {
                            return prev;
                          }
                          const nextValue = event.target.value.replace(",", ".");
                          if (nextValue !== "" && !/^\d*(\.\d?)?$/.test(nextValue)) {
                            return prev;
                          }
                          return { ...prev, quantityKg: nextValue };
                        })
                      }
                      className="input-field w-24 px-2 py-1"
                      placeholder="1 / 1.5"
                    />
                  ) : (
                    transaction.quantityKg
                  )}
                </td>
                <td className="border-b border-slate-200 px-3 py-2.5 text-right align-top">
                  {isEditing ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editDraft.priceInput}
                      onChange={(event) =>
                        setEditDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                priceInput: formatPriceInput(event.target.value),
                              }
                            : prev,
                        )
                      }
                      className="input-field w-32 px-2 py-1"
                    />
                  ) : (
                    formatIDR(transaction.pricePerKg)
                  )}
                </td>
                <td className="border-b border-slate-200 px-3 py-2.5 text-right align-top font-semibold text-slate-900">
                  {formatIDR(rowTotal)}
                </td>
                <td className="border-b border-slate-200 px-3 py-2.5 text-right align-top">
                  {isFirstDateRow ? formatIDR(dailySubtotalByDate.get(transaction.date) ?? 0) : ""}
                </td>
                <td className="border-b border-slate-200 px-3 py-2.5 align-top">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDraft.clientName}
                      onChange={(event) =>
                        setEditDraft((prev) =>
                          prev ? { ...prev, clientName: event.target.value } : prev,
                        )
                      }
                      className="input-field max-w-[180px] px-2 py-1"
                    />
                  ) : (
                    transaction.clientName
                  )}
                </td>
                <td className="border-b border-slate-200 px-2.5 py-2.5 align-top">
                  <div className="no-print-content flex flex-wrap items-center justify-center gap-1.5">
                    <AnimatePresence mode="wait" initial={false}>
                      {isEditing ? (
                        <motion.div
                          key="edit-actions"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={onSaveInlineEdit}
                          className="btn inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white shadow-sm"
                          >
                            <FiSave className="text-[11px]" />
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditDraft(null)}
                            className="btn ml-1.5 inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm"
                          >
                            <FiX className="text-[11px]" />
                            Batal
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="single-edit"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          type="button"
                          onClick={() => startInlineEdit(transaction)}
                          className="btn inline-flex items-center gap-1 overflow-hidden rounded-md bg-sky-600 px-2 py-1 text-[11px] font-medium text-white shadow-sm"
                        >
                          <FiEdit2 className="text-[11px]" />
                          Edit
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <button
                      type="button"
                      onClick={() => onDeleteRow(transaction.id)}
                      className="btn inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-1 text-[11px] font-medium text-white shadow-sm"
                    >
                      <FiTrash2 className="text-[11px]" />
                      Hapus
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </tbody>
      <tfoot>
        <tr className="bg-slate-50">
          <td colSpan={8} className="px-3 py-3 text-right align-bottom">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Total Bulanan
            </p>
          </td>
          <td className="px-3 py-3 text-right align-bottom">
            <p className="text-base font-bold text-slate-900">{formatIDR(monthlyTotal)}</p>
          </td>
          <td className="no-print-content px-3 py-3 align-bottom" />
        </tr>
      </tfoot>
    </table>
  );
}
