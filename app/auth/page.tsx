"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail, ShieldCheck, User, X } from "lucide-react";
import { logout, useSession } from "../lib/session";
import type { SessionUser } from "../lib/session";

type AuthMode = "login" | "register";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const EMAIL_DOMAIN_LABEL_REGEX =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const PASSWORD_ASCII_REGEX = /^[\x21-\x7E]+$/;
const MIN_PASSWORD_LENGTH = 8;

const isEmailDomainSyntaxValid = (domain: string) => {
  if (!domain || domain.length > 253) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1];
  if (!tld || tld.length < 2 || tld.length > 63) return false;
  return labels.every((label) => EMAIL_DOMAIN_LABEL_REGEX.test(label));
};

const isEmail = (value: string) => {
  if (!EMAIL_REGEX.test(value)) return false;
  const domain = value.split("@")[1] ?? "";
  return isEmailDomainSyntaxValid(domain);
};

const isAsciiPassword = (value: string) => PASSWORD_ASCII_REGEX.test(value);

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const { session, setSession } = useSession();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setEmail(session.email);
      setName(session.name ?? "");
    }
  }, [session]);

  const goHome = () => router.push(redirectTo || "/");

  const heading = useMemo(
    () => (mode === "login" ? "Вхід до акаунту" : "Створити акаунт"),
    [mode]
  );

  const handleModeChange = (value: AuthMode) => {
    setMode(value);
    setMessage(null);
    setError(null);
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!isEmail(trimmedEmail)) {
      setError("Вкажіть коректний email.");
      return;
    }

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Пароль має містити щонайменше ${MIN_PASSWORD_LENGTH} символів.`
      );
      return;
    }

    const payload: Record<string, unknown> = {
      email: trimmedEmail,
      password: trimmedPassword,
    };
    let endpoint = "/api/auth/login";

    if (mode === "register") {
      const trimmedName = name.trim();
      const trimmedConfirmPassword = confirmPassword.trim();
      if (!trimmedName) {
        setError("Вкажіть ім'я.");
        return;
      }
      if (
        !isAsciiPassword(trimmedPassword) ||
        !isAsciiPassword(trimmedConfirmPassword)
      ) {
        setError("Пароль має містити лише латинські літери, цифри та символи.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Паролі не співпадають.");
        return;
      }
      endpoint = "/api/auth/register";
      payload.name = trimmedName;
    }

    setSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok: boolean;
        user?: unknown;
        error?: string;
        requiresVerification?: boolean;
        devVerificationToken?: string;
      };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Не вдалося виконати запит.");
        return;
      }

      if (mode === "register" && data.requiresVerification) {
        setMessage("Перевірте пошту та підтвердіть реєстрацію.");
        return;
      }

      if (!data.user) {
        setError("Некоректна відповідь сервера. Спробуйте ще раз.");
        return;
      }

      setSession(data.user as SessionUser);
      setMessage(
        mode === "login" ? "Вхід успішний." : "Реєстрація успішна."
      );
      setTimeout(goHome, 400);
    } catch {
      setError("Сталася помилка. Спробуйте ще раз.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    setMessage("Сесію завершено.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060606]/96">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#98ff22]/12 blur-[140px]" />
        <div className="absolute right-[-20%] bottom-[-10%] h-[360px] w-[360px] rounded-full bg-[#98ff22]/8 blur-[120px]" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#0c0d10] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 md:px-7">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#98ff22]/40 bg-[#98ff22]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#98ff22]">
                <ShieldCheck className="h-4 w-4" /> Доступ
              </span>
              <p className="max-w-2xl text-base md:text-lg font-semibold text-white/80">
                Увійдіть або створіть акаунт, щоб бачити свій баланс балів та
                реєструватися на події Vidlik.
              </p>
            </div>
            <button
              type="button"
              onClick={goHome}
              aria-label="Закрити"
              className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 px-5 pb-6 pt-5 md:px-7">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
              <div className="mb-4">
                <div className="relative inline-flex overflow-hidden rounded-full bg-[#0b0c0f] p-1">
                  <div
                    className={`absolute inset-y-1 w-1/2 rounded-full bg-[#98ff22] transition-all duration-300 ease-out ${
                      mode === "login" ? "translate-x-0" : "translate-x-full"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleModeChange("login")}
                    className={`relative z-10 w-32 cursor-pointer px-4 py-2 text-sm font-semibold transition ${
                      mode === "login"
                        ? "text-black"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Вхід
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("register")}
                    className={`relative z-10 w-32 cursor-pointer px-4 py-2 text-sm font-semibold transition ${
                      mode === "register"
                        ? "text-black"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Реєстрація
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold tracking-tight">{heading}</h2>

              {session && !message && (
                <div className="mt-3 rounded-xl border border-[#98ff22]/30 bg-[#98ff22]/10 px-3 py-2 text-sm text-[#d9ff9c]">
                  Ви вже увійшли як <strong>{session.email}</strong>. Можете
                  продовжити або{" "}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="underline decoration-dotted underline-offset-4"
                  >
                    вийти
                  </button>
                  .
                </div>
              )}

              <form
                className="mt-5 space-y-4"
                onSubmit={handleAuth}
                autoComplete="off"
              >
                {mode === "register" && (
                  <label className="block space-y-2">
                    <span className="text-sm text-white/70">Ім'я та прізвище</span>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0c0f] px-3 py-2 focus-within:border-[#98ff22]/60">
                      <User className="h-4 w-4 text-white/50" />
                      <input
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Ваше ім'я"
                        className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                        autoComplete="off"
                      />
                    </div>
                  </label>
                )}

                <label className="block space-y-2">
                  <span className="text-sm text-white/70">Email</span>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0c0f] px-3 py-2 focus-within:border-[#98ff22]/60">
                    <Mail className="h-4 w-4 text-white/50" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@mail.com"
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                      autoComplete="off"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-white/70">Пароль</span>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0c0f] px-3 py-2 focus-within:border-[#98ff22]/60">
                    <Lock className="h-4 w-4 text-white/50" />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Мінімум 8 символів"
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                      autoComplete="new-password"
                    />
                  </div>
                </label>

                {mode === "register" && (
                  <label className="block space-y-2">
                    <span className="text-sm text-white/70">
                      Підтвердження паролю
                    </span>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0c0f] px-3 py-2 focus-within:border-[#98ff22]/60">
                      <Lock className="h-4 w-4 text-white/50" />
                      <input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Введіть пароль ще раз"
                        className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                        autoComplete="new-password"
                      />
                    </div>
                  </label>
                )}

                {error && (
                  <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </p>
                )}
                {message && (
                  <p className="rounded-2xl border border-[#98ff22]/30 bg-[#98ff22]/10 px-3 py-2 text-sm text-[#d9ff9c]">
                    {message}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#98ff22] bg-[#98ff22] px-5 py-2.5 text-sm font-semibold text-black transition hover:shadow-[0_0_30px_#98ff22] disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {mode === "login" ? "Увійти" : "Зареєструватися"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goHome}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/80 transition hover:border-white/30 hover:text-white"
                  >
                    Повернутись
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
