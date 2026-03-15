"use client";

export function LoginHero() {
  return (
    <aside className="hidden bg-[linear-gradient(145deg,#0e7490,#0369a1_55%,#075985)] p-10 text-white lg:block">
      <p className="inline-block rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
        Admin Access
      </p>
      <h2 className="mt-5 text-3xl font-semibold leading-tight">Laundry Report Dashboard</h2>
      <p className="mt-3 max-w-sm text-sm text-sky-100">
        Kelola transaksi harian dan pantau performa bulanan dalam satu panel admin yang ringkas.
      </p>
      <div className="mt-8 rounded-xl border border-white/20 bg-white/10 p-4 text-sm text-sky-50/95 backdrop-blur-sm">
        Gunakan akun admin untuk melanjutkan ke report center.
      </div>
    </aside>
  );
}
