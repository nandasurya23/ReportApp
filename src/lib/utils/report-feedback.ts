import { toast } from "sonner";

export function showResetAllConfirmation(onConfirm: () => void) {
  toast.warning("Reset semua data laporan?", {
    description: "Semua transaksi dan preferensi akan dihapus.",
    duration: 8000,
    action: {
      label: "Ya, Reset",
      onClick: onConfirm,
    },
    cancel: {
      label: "Batal",
      onClick: () => {
        toast.info("Reset dibatalkan.");
      },
    },
  });
}

export function showResetMonthConfirmation(
  selectedMonthLabel: string,
  onConfirm: () => void,
) {
  toast.warning(`Hapus data bulan ${selectedMonthLabel}?`, {
    description: "Semua transaksi pada bulan ini akan dihapus dan tidak bisa dibatalkan.",
    duration: 10000,
    action: {
      label: "Ya, Hapus Bulan Ini",
      onClick: onConfirm,
    },
    cancel: {
      label: "Batal",
      onClick: () => {
        toast.info("Hapus data bulan dibatalkan.");
      },
    },
  });
}
