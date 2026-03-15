import { isValidQuantityOneDecimal } from "@/lib/utils/laundry";

export function validateTransactionInput(input: {
  date: string;
  roomNumber: string;
  keterangan: string;
  quantityKg: number;
  pricePerKg: number;
  reportClientName: string;
}): string {
  if (!input.date) {
    return "Tanggal transaksi wajib diisi.";
  }
  if (!input.roomNumber.trim()) {
    return "No kamar wajib diisi.";
  }
  if (!input.reportClientName.trim()) {
    return "Nama client wajib diisi.";
  }
  if (!input.keterangan.trim()) {
    return "Keterangan wajib diisi.";
  }
  if (input.quantityKg <= 0) {
    return "Jumlah laundry harus lebih dari 0.";
  }
  if (!isValidQuantityOneDecimal(input.quantityKg)) {
    return "Satuan tidak valid.";
  }
  if (input.pricePerKg < 0) {
    return "Harga per KG tidak boleh negatif.";
  }
  return "";
}

export function parseQuantityInput(raw: string): number {
  const normalized = raw.trim();
  if (!normalized) {
    return 0;
  }
  if (!/^\d+(\.\d)?$/.test(normalized)) {
    return Number.NaN;
  }
  return Number(normalized);
}

export function parsePriceInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) {
    return 0;
  }
  return Number(digits);
}
