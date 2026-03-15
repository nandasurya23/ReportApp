"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff, FiLock, FiLogIn, FiUser } from "react-icons/fi";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { setAuthSessionFromUsername } from "@/lib/storage/local-storage";
import { safeJson } from "@/lib/utils/http";

const REMEMBER_USERNAME_KEY = "laundry.remembered_username";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rememberedUsername = window.localStorage.getItem(REMEMBER_USERNAME_KEY)?.trim() ?? "";
    if (!rememberedUsername) {
      return;
    }
    setUsername(rememberedUsername);
    setRememberMe(true);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      const message = "Username dan password wajib diisi.";
      setError(message);
      toast.error(message);
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

      const payload = await safeJson(response, {} as {
        user?: { username?: string };
        error?: string;
      });

      if (!response.ok || !payload.user?.username) {
        const message = payload.error || "Login gagal. Cek kembali kredensial.";
        setError(message);
        toast.error(message);
        return;
      }

      if (typeof window !== "undefined") {
        if (rememberMe) {
          window.localStorage.setItem(REMEMBER_USERNAME_KEY, username.trim());
        } else {
          window.localStorage.removeItem(REMEMBER_USERNAME_KEY);
        }
      }

      setAuthSessionFromUsername(payload.user.username);
      toast.success("Login berhasil.");
      router.push("/report");
    } catch {
      const message = "Login gagal. Coba lagi.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_12%_18%,#e0f2fe,transparent_32%),radial-gradient(circle_at_88%_12%,#bae6fd,transparent_28%),linear-gradient(180deg,#f8fafc,#eef6ff)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[32px_32px]" />
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="surface-card relative z-10 grid w-full max-w-5xl overflow-hidden border border-slate-200/80 shadow-[0_24px_64px_-28px_rgba(15,23,42,0.45)] lg:grid-cols-2"
      >
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

        <div className="p-6 sm:p-8 lg:p-10">
          <p className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 lg:hidden">
            Admin Access
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">Login Laundry</h1>
          <p className="mt-2 text-sm text-slate-600">Masuk untuk membuka dashboard laporan.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
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
                  autoFocus
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="input-field input-with-icon"
                  placeholder="Masukkan username"
                  aria-invalid={Boolean(error)}
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field input-with-icon pr-10"
                  placeholder="Masukkan password"
                  aria-invalid={Boolean(error)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <label className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
              Remember Me
            </label>

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
