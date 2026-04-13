"use client";

import { FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { CustomDatePicker } from "@/components/report/custom-date-picker";
import { Spinner } from "@/components/ui/spinner";

interface ReportTransactionFormProps {
  onSubmitAdd: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  formDate: string;
  setFormDate: (value: string) => void;
  formRoomNumber: string;
  setFormRoomNumber: (value: string) => void;
  reportClientName: string;
  setReportClientName: (value: string) => void;
  reportKeterangan: string;
  setReportKeterangan: (value: string) => void;
  formQuantityKg: string;
  setFormQuantityKg: (value: string) => void;
  formPriceInput: string;
  setFormPriceInput: (value: string) => void;
  formatPriceInput: (raw: string) => string;
  error: string;
  isCreatingTransaction: boolean;
}

export function ReportTransactionForm({
  onSubmitAdd,
  formDate,
  setFormDate,
  formRoomNumber,
  setFormRoomNumber,
  reportClientName,
  setReportClientName,
  reportKeterangan,
  setReportKeterangan,
  formQuantityKg,
  setFormQuantityKg,
  formPriceInput,
  setFormPriceInput,
  formatPriceInput,
  error,
  isCreatingTransaction,
}: ReportTransactionFormProps) {
  return (
    <motion.form
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      onSubmit={onSubmitAdd}
      className="no-print h-fit rounded-2xl border border-[#e7ddd1]/60 bg-[#fbf8f4]/90 p-4 shadow-sm sm:p-5 xl:sticky xl:top-6"
    >
      <div className="border-b border-[#e7ddd1] pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7764]">
          Entry transaksi
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#2f2a25]">Form Transaksi</h2>
        <p className="mt-1 text-sm text-[#6d5d50]">
          Isi data harian untuk akumulasi laporan bulanan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4">
        <div className="rounded-2xl border border-[#e7ddd1]/50 bg-[#f8f1e8]/50 p-3">
          <CustomDatePicker id="date" value={formDate} label="Tanggal" onChange={setFormDate} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="room-number" className="field-label">
              No Kamar
            </label>
            <input
              id="room-number"
              type="text"
              value={formRoomNumber}
              onChange={(event) => setFormRoomNumber(event.target.value)}
              className="input-field border-transparent bg-[#fbf8f4] shadow-none focus:border-[#e7ddd1]"
              placeholder="Contoh: A-12"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="qty" className="field-label">
              Berat (kg)
            </label>
            <input
              id="qty"
              type="text"
              inputMode="decimal"
              value={formQuantityKg}
              onChange={(event) => {
                const nextValue = event.target.value.trim().replace(/,/g, ".");
                if (nextValue === "") {
                  setFormQuantityKg("");
                  return;
                }
                if (!/^\d*(\.\d?)?$/.test(nextValue)) {
                  return;
                }
                setFormQuantityKg(nextValue);
              }}
              className="input-field border-transparent bg-[#fbf8f4] shadow-none focus:border-[#e7ddd1]"
              placeholder="Contoh: 1,5 atau 1.5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="client-name" className="field-label">
            Nama Client
          </label>
          <p className="mt-0.5 rounded-md bg-[#f8f1e8] px-2 py-1 text-xs font-medium text-[#5b4f44]">
            Diisi sekali untuk laporan bulan aktif.
          </p>
          <input
            id="client-name"
            type="text"
            value={reportClientName}
            onChange={(event) => setReportClientName(event.target.value)}
            className="input-field border-transparent bg-[#fbf8f4] shadow-none focus:border-[#e7ddd1]"
            placeholder="Contoh: John Doe"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="keterangan" className="field-label">
            Keterangan
          </label>
          <p className="mt-0.5 rounded-md bg-[#f8f1e8] px-2 py-1 text-xs font-medium text-[#5b4f44]">
            Diisi sekali untuk catatan laporan bulan aktif.
          </p>
          <input
            id="keterangan"
            type="text"
            value={reportKeterangan}
            onChange={(event) => setReportKeterangan(event.target.value)}
            className="input-field border-transparent bg-[#fbf8f4] shadow-none focus:border-[#e7ddd1]"
            placeholder='Contoh: "bawa hari minggu"'
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="field-label">
            Harga
          </label>
          <input
            id="price"
            type="text"
            inputMode="numeric"
            value={formPriceInput}
            onChange={(event) => setFormPriceInput(formatPriceInput(event.target.value))}
            className="input-field border-transparent bg-[#fbf8f4] shadow-none focus:border-[#e7ddd1]"
            placeholder="Contoh: 1.000.000"
          />
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg border border-rose-200 bg-[#fff5f2] px-3 py-2 text-sm text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={isCreatingTransaction}
        className="btn btn-primary mt-4 flex w-full items-center justify-center gap-2 py-2.5"
      >
        {isCreatingTransaction && <Spinner size="sm" className="border-slate-200 border-t-white" />}
        <Plus className="size-[15px]" strokeWidth={2.6} />
        {isCreatingTransaction ? "Menyimpan..." : "Tambah"}
      </button>
    </motion.form>
  );
}
