"use client";

import { FormEvent } from "react";
import { motion } from "framer-motion";
import { FiEdit3, FiHome, FiPackage, FiPlus, FiTag, FiUsers } from "react-icons/fi";

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
      className="surface-card no-print h-fit p-4 sm:p-5 xl:sticky xl:top-6"
    >
      <div className="mb-4 border-b border-slate-200 pb-3">
        <h2 className="text-lg font-semibold text-slate-900">Form Transaksi</h2>
        <p className="mt-1 text-xs text-slate-600">Isi data harian untuk akumulasi laporan bulanan.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3">
          <CustomDatePicker id="date" value={formDate} label="Tanggal" onChange={setFormDate} />
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3">
          <label htmlFor="room-number" className="field-label flex items-center gap-1.5">
            <FiHome className="text-slate-500" />
            No Kamar
          </label>
          <div className="relative">
            <FiHome className="input-leading-icon" />
            <input
              id="room-number"
              type="text"
              value={formRoomNumber}
              onChange={(event) => setFormRoomNumber(event.target.value)}
              className="input-field input-with-icon"
              placeholder="Contoh: A-12"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3">
          <label htmlFor="client-name" className="field-label flex items-center gap-1.5">
            <FiUsers className="text-slate-500" />
            Nama Client (diisi sekali)
          </label>
          <div className="relative">
            <FiUsers className="input-leading-icon" />
            <input
              id="client-name"
              type="text"
              value={reportClientName}
              onChange={(event) => setReportClientName(event.target.value)}
              className="input-field input-with-icon"
              placeholder="Contoh: John Doe"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3">
          <label htmlFor="keterangan" className="field-label flex items-center gap-1.5">
            <FiEdit3 className="text-slate-500" />
            Keterangan (diisi sekali)
          </label>
          <div className="relative">
            <FiEdit3 className="input-leading-icon" />
            <input
              id="keterangan"
              type="text"
              value={reportKeterangan}
              onChange={(event) => setReportKeterangan(event.target.value)}
              className="input-field input-with-icon"
              placeholder='Contoh: "bawa hari minggu"'
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/90 bg-white p-3">
            <label htmlFor="qty" className="field-label flex items-center gap-1.5">
              <FiPackage className="text-slate-500" />
              Satuan
            </label>
            <div className="relative">
              <FiPackage className="input-leading-icon" />
              <input
                id="qty"
                type="text"
                inputMode="decimal"
                value={formQuantityKg}
                onChange={(event) => {
                  const nextValue = event.target.value.trim();
                  if (nextValue === "") {
                    setFormQuantityKg("");
                    return;
                  }
                  if (!/^\d*(\.\d?)?$/.test(nextValue)) {
                    return;
                  }
                  setFormQuantityKg(nextValue);
                }}
                className="input-field input-with-icon"
                placeholder="Contoh: 1 atau 1.5"
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white p-3">
            <label htmlFor="price" className="field-label flex items-center gap-1.5">
              <FiTag className="text-slate-500" />
              Harga
            </label>
            <div className="relative">
              <FiTag className="input-leading-icon" />
              <input
                id="price"
                type="text"
                inputMode="numeric"
                value={formPriceInput}
                onChange={(event) => setFormPriceInput(formatPriceInput(event.target.value))}
                className="input-field input-with-icon"
                placeholder="Contoh: 1.000.000"
              />
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={isCreatingTransaction}
        className="btn btn-primary mt-4 flex w-full items-center justify-center gap-2 py-2.5"
      >
        {isCreatingTransaction && <Spinner size="sm" className="border-slate-200 border-t-white" />}
        <FiPlus className="text-base" />
        {isCreatingTransaction ? "Menyimpan..." : "Tambah"}
      </button>
    </motion.form>
  );
}
