export function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50/70 p-10 text-center">
      <p className="text-base font-semibold text-slate-900">Belum Ada Transaksi</p>
      <p className="mt-1 text-sm text-slate-700">
        Tambahkan transaksi pertama untuk bulan dan tahun yang dipilih.
      </p>
    </div>
  );
}
