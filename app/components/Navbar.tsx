"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Menu, X, User } from "lucide-react";
import { logout as apiLogout, useSession } from "../lib/session";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const { session, hydrated, setSession } = useSession();
  const router = useRouter();

  useLayoutEffect(() => {
    const updateOffset = () => {
      const header = headerRef.current;
      if (!header) return;
      const offset = Math.round(header.getBoundingClientRect().height + 48);
      const root = document.documentElement;
      root.style.setProperty("--nav-offset", `${offset}px`);
      root.style.setProperty("scroll-padding-top", `${offset}px`);
    };
    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, []);

  const closeMenu = () => setOpen(false);

  const handleAuthClick = () => {
    router.push("/auth");
  };

  const handleLogout = async (afterLogout?: () => void) => {
    await apiLogout();
    setSession(null);
    if (afterLogout) {
      afterLogout();
    }
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-2000 border-b border-white/5 bg-[#0f1012]/70 backdrop-blur supports-backdrop-filter:bg-[#0f1012]/40"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Логотип */}
        <a href="#top" className="group inline-flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#98ff22]/50 bg-linear-to-br from-[#98ff22]/20 to-transparent shadow-[0_0_40px_#98ff22]">
            <Sparkles className="h-5 w-5 text-[#98ff22]" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-widest text-white/60">
              Vidlik
            </p>
            <span className="-mt-1 text-lg font-black tracking-tight">
              Community
            </span>
          </div>
        </a>

        {/* Десктоп меню */}
        <nav className="hidden gap-8 md:flex">
          <a
            href="#mission"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Про нас
          </a>
          <a
            href="#what"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Що ми робимо
          </a>
          <a
            href="#events"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Події
          </a>
          <a
            href="#join"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Контакти
          </a>
        </nav>

        {/* Стан користувача / авторизація */}
        <div className="hidden md:flex items-center gap-2">
          {!hydrated ? (
            <div className="h-10 w-36 rounded-full border border-white/10 bg-white/5" />
          ) : session ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white">
                <User className="h-4 w-4 text-[#98ff22]" />
                <span>{session.name || session.email}</span>
              </div>
              <button
                type="button"
                onClick={() => handleLogout()}
                className="rounded-full px-3 py-2 text-sm cursor-pointer text-white/80 transition hover:text-white"
              >
                Вийти
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleAuthClick}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#98ff22] bg-[#98ff22] px-4 py-2 cursor-pointer text-sm font-semibold text-black shadow-[0_0_20px_#98ff22] transition active:scale-[0.98] hover:shadow-[0_0_40px_#98ff22]"
            >
              Авторизуватися
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Мобільний перемикач */}
        <button
          type="button"
          className="md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Мобільне меню */}
      <div
        className={`
          md:hidden border-t border-white/5 bg-[#0f1012]
          overflow-hidden transform transition-all duration-500 ease-out
          ${open ? "max-h-96 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"}
        `}
      >
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="grid gap-3">
            {!hydrated ? (
              <div className="h-12 rounded-xl border border-white/10 bg-white/5" />
            ) : session ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-[#98ff22]" />
                  {session.name || session.email}
                </div>
              </div>
            ) : null}

            <a
              href="#mission"
              onClick={closeMenu}
              className="rounded-xl bg-white/5 px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white"
            >
              Про нас
            </a>
            <a
              href="#what"
              onClick={closeMenu}
              className="rounded-xl bg-white/5 px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white"
            >
              Що ми робимо
            </a>
            <a
              href="#events"
              onClick={closeMenu}
              className="rounded-xl bg-white/5 px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white"
            >
              Події
            </a>
            <a
              href="#join"
              onClick={closeMenu}
              className="rounded-xl bg-white/5 px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white"
            >
              Контакти
            </a>

            {!hydrated ? null : session ? (
              <button
                type="button"
                onClick={() => handleLogout(closeMenu)}
                className="w-full rounded-xl bg-white/5 px-4 py-3 cursor-pointer text-left text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Вийти
              </button>
            ) : (
              <a
                href="/auth"
                onClick={closeMenu}
                className="rounded-xl bg-[#98ff22] px-4 py-3 text-center font-semibold text-black cursor-pointer"
              >
                Авторизація
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
