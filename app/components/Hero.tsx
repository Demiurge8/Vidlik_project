"use client";

import { Languages, ArrowRight } from "lucide-react";
import { RevealSection } from "./RevealSection";
import { HeroMapCard } from "./HeroMapCard";
import { useSession } from "../lib/session";

export function Hero() {
  const { session, hydrated } = useSession();

  return (
    <RevealSection
      id="hero"
      className="mx-auto max-w-7xl px-4 pt-16 md:pt-24"
      aria-labelledby="hero-title"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#98ff22] bg-[#98ff22]/10 px-3 py-1 text-xs text-[#98ff22]">
            <Languages className="h-3.5 w-3.5" />
            UA / DK
          </div>

          <h1
            id="hero-title"
            className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl"
          >
            Vidlik — комʼюніті українців у Данії
            <span className="block text-[#98ff22]">
              Події, підтримка, нові друзі
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-white/70">
            Допомагаємо адаптуватися, знаходити людей зі схожими цінностями та
            відчувати себе на своєму місці: івенти, нетворкінг, творчі ініціативи
            й взаємодопомога.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!hydrated ? (
              <div className="h-12 w-48 rounded-2xl border border-white/10 bg-white/5" />
            ) : !session ? (
              <>
                <a
                  href="/auth"
                  className="group inline-flex items-center gap-2 rounded-2xl border border-[#98ff22] bg-[#98ff22] px-5 py-3 text-base font-semibold text-black shadow-[0_0_24px_#98ff22] transition hover:shadow-[0_0_44px_#98ff22]"
                >
                  Авторизація / реєстрація
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                </a>

                <a
                  href="#what"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-base text-white/90 hover:bg-white/10"
                >
                  Дізнатись більше
                </a>
              </>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-white/50">
            <div className="flex -space-x-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border border-white/10 bg-gradient-to-br from-white/20 to-white/5"
                />
              ))}
            </div>
            <p className="text-sm">1k+ учасників та друзів Vidlik</p>
          </div>
        </div>

        <div className="relative">
          <HeroMapCard />
        </div>
      </div>
    </RevealSection>
  );
}
