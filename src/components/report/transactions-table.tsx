"use client";

import { memo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, PencilLine, Trash2, X } from "lucide-react";

import { IconChip } from "@/components/report/icon-chip";
import { formatIDR } from "@/lib/utils/currency";
import { formatISODateToLongID } from "@/lib/utils/date";
import { getDailyTotal, getDailyTotalFromValues } from "@/lib/utils/laundry";
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

interface TransactionRowProps {
  transaction: LaundryTransaction;
  index: number;
  isFirstDateRow: boolean;
  dailySubtotalByDate: Map<string, number>;
  noteCountByDate: Map<string, number>;
  editDraft: EditDraft | null;
  setEditDraft: React.Dispatch<React.SetStateAction<EditDraft | null>>;
  startInlineEdit: (transaction: LaundryTransaction) => void;
  onSaveInlineEdit: () => void;
  onDeleteRow: (id: string) => void;
  parsePriceInput: (raw: string) => number;
  formatPriceInput: (raw: string) => string;
}

function TransactionRowComponent({
  transaction,
  index,
  isFirstDateRow,
  dailySubtotalByDate,
  noteCountByDate,
  editDraft,
  setEditDraft,
  startInlineEdit,
  onSaveInlineEdit,
  onDeleteRow,
  parsePriceInput,
  formatPriceInput,
}: TransactionRowProps) {
  const isEditing = editDraft?.id === transaction.id;
  const showDateGroup = isFirstDateRow || isEditing;
  const rowTotal = isEditing
    ? getDailyTotalFromValues(
      Number(editDraft.quantityKg || "0"),
      parsePriceInput(editDraft.priceInput),
    )
    : getDailyTotal(transaction);

  const handleStartEdit = useCallback(() => {
    startInlineEdit(transaction);
  }, [startInlineEdit, transaction]);

  const handleDelete = useCallback(() => {
    onDeleteRow(transaction.id);
  }, [onDeleteRow, transaction.id]);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`transition-colors ${isEditing ? "bg-slate-50 ring-1 ring-inset ring-slate-200" : "bg-white"} text-slate-900`}
    >
      <td className="border border-slate-200 px-3 py-2.5 align-top">{index + 1}</td>
      <td className="border border-slate-200 px-3 py-2.5 align-top">
        {isEditing ? (
          <input
            type="date"
            value={editDraft.date}
            onChange={(event) =>
              setEditDraft((prev) => (prev ? { ...prev, date: event.target.value } : prev))
            }
            className="input-field max-w-42.5 px-2 py-1"
          />
        ) : (
          showDateGroup ? formatISODateToLongID(transaction.date) : ""
        )}
      </td>
      <td className="border border-slate-200 px-3 py-2.5 text-center align-top">
        {noteCountByDate.get(transaction.id) ?? 0}
      </td>
      <td className="border border-slate-200 px-3 py-2.5 text-center align-top">
        {isEditing ? (
          <input
            type="text"
            value={editDraft.roomNumber}
            onChange={(event) =>
              setEditDraft((prev) => (prev ? { ...prev, roomNumber: event.target.value } : prev))
            }
            className="input-field max-w-32.5 px-2 py-1"
          />
        ) : (
          transaction.roomNumber
        )}
      </td>
      <td className="border border-slate-200 px-3 py-2.5 text-center align-top">
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
                const nextValue = event.target.value.trim();
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
      <td className="border border-slate-200 px-3 py-2.5 text-right align-top">
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
      <td className="border border-slate-200 px-3 py-2.5 text-right align-top font-semibold text-slate-900">
        {formatIDR(rowTotal)}
      </td>
      <td className="border border-slate-200 px-3 py-2.5 text-right align-top">
        {showDateGroup ? formatIDR(dailySubtotalByDate.get(transaction.date) ?? 0) : ""}
      </td>
      <td className="border border-slate-200 px-3 py-2.5 align-top">
        {isEditing ? (
          <input
            type="text"
            value={editDraft.clientName}
            onChange={(event) =>
              setEditDraft((prev) => (prev ? { ...prev, clientName: event.target.value } : prev))
            }
            className="input-field max-w-45 px-2 py-1"
          />
        ) : (
          showDateGroup ? transaction.clientName : ""
        )}
      </td>
      <td className="border border-slate-200 px-2.5 py-2.5 align-top">
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
                  className="btn inline-flex items-center gap-1 rounded-md border border-[#6d5d50]/20 bg-[#3a332d] px-2.5 py-1 text-[11px] font-medium text-[#f7f1e8]"
                >
                  <IconChip tone="slate" className="h-5 w-5 border-white/10 bg-white/10 text-[#f7f1e8]">
                    <Check className="size-[13px]" strokeWidth={2.8} />
                  </IconChip>
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setEditDraft(null)}
                  className="btn ml-1.5 inline-flex items-center gap-1 rounded-md border border-[#e7ddd1] bg-[#fbf8f4] px-2.5 py-1 text-[11px] font-medium text-[#5b4f44]"
                >
                  <IconChip tone="slate" className="h-5 w-5 border-[#e7ddd1] bg-[#f8f1e8] text-[#6d5d50]">
                    <X className="size-[13px]" strokeWidth={2.8} />
                  </IconChip>
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
                onClick={handleStartEdit}
                className="btn inline-flex items-center gap-1 overflow-hidden rounded-md border border-[#e7ddd1] bg-[#fbf8f4] px-2.5 py-1 text-[11px] font-medium text-[#5b4f44]"
              >
                <IconChip tone="slate" className="h-5 w-5 border-[#e7ddd1] bg-[#f8f1e8] text-[#6d5d50]">
                  <PencilLine className="size-[13px]" strokeWidth={2.8} />
                </IconChip>
                Edit
              </motion.button>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleDelete}
            className="btn inline-flex items-center gap-1 rounded-md border border-rose-200 bg-[#fff5f2] px-2.5 py-1 text-[11px] font-medium text-rose-700"
          >
            <IconChip tone="rose" className="h-5 w-5 border-[#ead4ce] bg-[#fff5f2] text-[#a35f52]">
              <Trash2 className="size-[13px]" strokeWidth={2.8} />
            </IconChip>
            Hapus
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

const TransactionRow = memo(
  TransactionRowComponent,
  (prev, next) =>
    prev.transaction === next.transaction &&
    prev.index === next.index &&
    prev.isFirstDateRow === next.isFirstDateRow &&
    prev.dailySubtotalByDate === next.dailySubtotalByDate &&
    prev.noteCountByDate === next.noteCountByDate &&
    prev.editDraft === next.editDraft &&
    prev.setEditDraft === next.setEditDraft &&
    prev.startInlineEdit === next.startInlineEdit &&
    prev.onSaveInlineEdit === next.onSaveInlineEdit &&
    prev.onDeleteRow === next.onDeleteRow &&
    prev.parsePriceInput === next.parsePriceInput &&
    prev.formatPriceInput === next.formatPriceInput,
);

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
    <table className="report-table min-w-290 border-collapse border border-slate-200 bg-white text-[13px] text-slate-700">
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
        <tr className="bg-slate-100 text-left text-slate-900">
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Nomer
          </th>
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Tanggal
          </th>
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-center">
            Jumlah Nota
          </th>
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-center">
            No Kamar
          </th>
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-center">
            Satuan
          </th>
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-center">
            Harga
          </th>
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-right">
            Harga Total Harian
          </th>
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-right">
            Total Keseluruhan
          </th>
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Keterangan
          </th>
          <th className="sticky top-0 z-10 border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-center">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        <AnimatePresence initial={false}>
          {filteredTransactions.map((transaction, index) => {
            const isFirstDateRow =
              index === 0 || filteredTransactions[index - 1].date !== transaction.date;

            return (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                index={index}
                isFirstDateRow={isFirstDateRow}
                dailySubtotalByDate={dailySubtotalByDate}
                noteCountByDate={noteCountByDate}
                editDraft={editDraft}
                setEditDraft={setEditDraft}
                startInlineEdit={startInlineEdit}
                onSaveInlineEdit={onSaveInlineEdit}
                onDeleteRow={onDeleteRow}
                parsePriceInput={parsePriceInput}
                formatPriceInput={formatPriceInput}
              />
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
            <p className="wrap-break-word text-sm font-bold leading-tight text-slate-900">
              {formatIDR(monthlyTotal)}
            </p>
          </td>
          <td className="no-print-content border border-slate-300 px-3 py-2 align-bottom" />
        </tr>
      </tfoot>
    </table>
  );
}
