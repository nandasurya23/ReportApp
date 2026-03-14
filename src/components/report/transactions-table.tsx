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
    <table className="report-table min-w-290 border-collapse border border-slate-300 bg-white text-[13px] text-slate-700">
      <colgroup>
        <col className="w-17.5" />
        <col className="w-45" />
        <col className="w-25" />
        <col className="w-27.5" />
        <col className="w-22.5" />
        <col className="w-35" />
        <col className="w-42.5" />
        <col className="w-42.5" />
        <col className="w-auto" />
        <col className="w-31.5" />
      </colgroup>
      <thead>
        <tr className="bg-slate-200 text-left text-slate-900">
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
            Nomer
          </th>
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
            Tanggal
          </th>
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-center">
            Jumlah Nota
          </th>
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-center">
            No Kamar
          </th>
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-center">
            Satuan
          </th>
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-center">
            Harga
          </th>
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-right">
            Harga Total Harian
          </th>
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-right">
            Total Keseluruhan
          </th>
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
            Keterangan
          </th>
          <th className="border border-slate-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-center">
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
            const showDateGroup = isFirstDateRow || isEditing;
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
                    : "bg-white"
                } text-slate-900`}
              >
                <td className="border border-slate-300 px-3 py-2 align-top">{index + 1}</td>
                <td className="border border-slate-300 px-3 py-2 align-top">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editDraft.date}
                      onChange={(event) =>
                        setEditDraft((prev) =>
                          prev ? { ...prev, date: event.target.value } : prev,
                        )
                      }
                      className="input-field max-w-42.5 px-2 py-1"
                    />
                  ) : (
                    showDateGroup ? formatISODateToLongID(transaction.date) : ""
                  )}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right align-top">
                  {noteCountByDate.get(transaction.id) ?? 0}
                </td>
                <td className="border border-slate-300 px-3 py-2 align-top">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDraft.roomNumber}
                      onChange={(event) =>
                        setEditDraft((prev) =>
                          prev ? { ...prev, roomNumber: event.target.value } : prev,
                        )
                      }
                      className="input-field max-w-32.5 px-2 py-1"
                    />
                  ) : (
                    transaction.roomNumber
                  )}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right align-top">
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
                <td className="border border-slate-300 px-3 py-2 text-right align-top">
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
                <td className="border border-slate-300 px-3 py-2 text-right align-top font-semibold text-slate-900">
                  {formatIDR(rowTotal)}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right align-top">
                  {showDateGroup ? formatIDR(dailySubtotalByDate.get(transaction.date) ?? 0) : ""}
                </td>
                <td className="border border-slate-300 px-3 py-2 align-top">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDraft.clientName}
                      onChange={(event) =>
                        setEditDraft((prev) =>
                          prev ? { ...prev, clientName: event.target.value } : prev,
                        )
                      }
                      className="input-field max-w-45 px-2 py-1"
                    />
                  ) : (
                    showDateGroup ? transaction.clientName : ""
                  )}
                </td>
                <td className="border border-slate-300 px-2.5 py-2 align-top">
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
        <tr className="bg-slate-200">
          <td colSpan={8} className="border border-slate-300 px-3 py-2 text-right align-bottom">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Total Bulanan
            </p>
          </td>
          <td className="border border-slate-300 px-3 py-2 text-right align-bottom">
            <p className="text-base font-bold text-slate-900">{formatIDR(monthlyTotal)}</p>
          </td>
          <td className="no-print-content border border-slate-300 px-3 py-2 align-bottom" />
        </tr>
      </tfoot>
    </table>
  );
}
