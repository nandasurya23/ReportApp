interface EmptyStateProps {
  selectedMonthLabel: string;
}

export function EmptyState({ selectedMonthLabel }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8ccbc] bg-[#f8f1e8]/80 p-10 text-center">
      <p className="text-base font-semibold tracking-tight text-[#2f2a25]">Tidak ada transaksi</p>
      <p className="mt-1 text-sm text-[#6d5d50]">
        Bulan {selectedMonthLabel} masih kosong. Tambahkan transaksi pertama untuk bulan ini.
      </p>
    </div>
  );
}
