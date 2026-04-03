interface EmptyStateProps {
  selectedMonthLabel: string;
}

export function EmptyState({ selectedMonthLabel }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center">
      <p className="text-base font-semibold tracking-tight text-slate-900">Tidak ada transaksi</p>
      <p className="mt-1 text-sm text-slate-600">
        Bulan {selectedMonthLabel} masih kosong. Tambahkan transaksi pertama untuk bulan ini.
      </p>
    </div>
  );
}
