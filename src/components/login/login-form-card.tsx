"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import { FiEye, FiEyeOff, FiLock, FiLogIn, FiUser } from "react-icons/fi";

import { Spinner } from "@/components/ui/spinner";

interface LoginFormCardProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  error: string;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export function LoginFormCard({
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  error,
  isSubmitting,
  onSubmit,
}: LoginFormCardProps) {
  return (
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

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

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
  );
}
