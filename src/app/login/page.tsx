"use client";

import { motion } from "framer-motion";

import { useLoginAuth } from "@/app/login/use-login-auth";
import { useLoginForm } from "@/app/login/use-login-form";
import { LoginFormCard } from "@/components/login/login-form-card";
import { LoginHero } from "@/components/login/login-hero";

const REMEMBER_USERNAME_KEY = "laundry.remembered_username";

export default function LoginPage() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    getValidationError,
  } = useLoginForm({
    rememberUsernameKey: REMEMBER_USERNAME_KEY,
  });
  const { error, isSubmitting, onSubmit } = useLoginAuth({
    username,
    password,
    rememberMe,
    rememberUsernameKey: REMEMBER_USERNAME_KEY,
    getValidationError,
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_12%_18%,#e0f2fe,transparent_32%),radial-gradient(circle_at_88%_12%,#bae6fd,transparent_28%),linear-gradient(180deg,#f8fafc,#eef6ff)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[32px_32px]" />
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="surface-card relative z-10 grid w-full max-w-5xl overflow-hidden border border-slate-200/80 shadow-[0_24px_64px_-28px_rgba(15,23,42,0.45)] lg:grid-cols-2"
      >
        <LoginHero />
        <LoginFormCard
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      </motion.section>
    </main>
  );
}
