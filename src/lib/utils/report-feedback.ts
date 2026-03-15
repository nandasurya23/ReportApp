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
