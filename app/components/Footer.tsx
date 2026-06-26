import { Sparkles } from "lucide-react";
import { RevealSection } from "./RevealSection";

export function Footer() {
  return (
    <RevealSection className="border-t border-white/5 bg-black/40 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-3">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-[#98ff22]/50 bg-[#98ff22]/10 px-2 py-1 text-xs text-[#98ff22]">
            <Sparkles className="h-4 w-4" />
            Vidlik Community
          </div>
          <p className="text-sm text-white/60">
            Українська молодіжна спільнота в Данії. 2026 © Vidlik.
          </p>
        </div>

        <div className="text-sm text-white/70">
          <p className="font-semibold text-white">Навігація</p>
          <ul className="mt-2 space-y-1">
            <li>
              <a href="#mission" className="hover:underline">
                Місія
              </a>
            </li>
            <li>
              <a href="#what" className="hover:underline">
                Що ми робимо
              </a>
            </li>
            <li>
              <a href="#events" className="hover:underline">
                Івенти
              </a>
            </li>
            <li>
              <a href="#join" className="hover:underline">
                Долучайся
              </a>
            </li>
          </ul>
        </div>

        <div className="text-sm text-white/70">
          <p className="font-semibold text-white">Контакти</p>
          <p className="mt-2">
            Email:{" "}
            <a
              href="mailto:hey@vidlik.dk"
              className="hover:underline"
            >
              hey@vidlik.dk
            </a>
          </p>
          <p>
            Telegram:{" "}
            <a
              className="hover:underline"
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
            >
              @vidlik
            </a>
          </p>
        </div>
      </div>
    </RevealSection>
  );
}
