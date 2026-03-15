"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FiLock, FiLogIn, FiUser } from "react-icons/fi";

import { Spinner } from "@/components/ui/spinner";
import { setAuthSession } from "@/lib/storage/local-storage";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        user?: { username?: string };
        error?: string;
      };

      if (!response.ok || !payload.user?.username) {
        setError(payload.error || "Login gagal. Cek kembali kredensial.");
        return;
      }

      setAuthSession({
        username: payload.user.username,
        loggedInAt: new Date().toISOString(),
      });
      router.push("/report");
    } catch {
      setError("Login gagal. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#ecfeff,transparent_35%),radial-gradient(circle_at_80%_10%,#cffafe,transparent_30%),#f8fafc] px-3 py-6 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="surface-card relative grid w-full max-w-5xl overflow-hidden lg:grid-cols-2"
      >
        <aside className="hidden bg-linear-to-br from-cyan-600 to-sky-700 p-8 text-white lg:block">
          <p className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Laundry MVP
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight">Laundry Report Dashboard</h2>
          <p className="mt-3 text-sm text-sky-100">
            Input transaksi harian, review total bulanan, dan export laporan dengan lebih cepat.
          </p>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          <p className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 lg:hidden">
            Laundry MVP
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">Login Laundry</h1>
          <p className="mt-2 text-sm text-slate-600">Dummy auth untuk MVP frontend.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="field-label flex items-center gap-1.5">
                <FiUser className="text-slate-500" />
                Username
              </label>
              <div className="relative">
                <FiUser className="input-leading-icon" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="input-field input-with-icon"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="field-label flex items-center gap-1.5">
                <FiLock className="text-slate-500" />
                Password
              </label>
              <div className="relative">
                <FiLock className="input-leading-icon" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field input-with-icon"
                  placeholder="Masukkan password"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex w-full items-center justify-center gap-2 py-2.5 disabled:opacity-60"
            >
              {isSubmitting && <Spinner size="sm" className="border-slate-200 border-t-white" />}
              {!isSubmitting && <FiLogIn />}
              {isSubmitting ? "Memproses..." : "Login"}
            </button>
          </form>
        </div>
      </motion.section>
    </main>
  );
}
