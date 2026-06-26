import { MessageSquare, Instagram, Mail, MapPinned } from "lucide-react";
import { RevealSection } from "./RevealSection";

export function Join() {
  return (
    <RevealSection
      id="join"
      className="scroll-mt-24 mx-auto max-w-7xl px-4 pb-24"
      aria-labelledby="join-title"
    >
      <div className="grid items-center gap-8 rounded-3xl border border-[#98ff22]/30 bg-gradient-to-br from-[#98ff22]/10 to-transparent p-8 md:grid-cols-2 md:p-12">
        <div>
          <h2
            id="join-title"
            className="text-3xl font-bold tracking-tight"
          >
            Долучайся до Vidlik
          </h2>
          <p className="mt-3 max-w-prose text-white/80">
            Vidlik — це не просто організація. Це місце, де можна посміятися,
            поговорити, створити щось разом і відчути, що ти не один. Тут не
            треба бути ідеальним — достатньо бути собою.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#98ff22] bg-[#98ff22] px-5 py-3 font-semibold text-black shadow-[0_0_24px_#98ff22] transition hover:shadow-[0_0_44px_#98ff22]"
            >
              Telegram
              <MessageSquare className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-base text-white/90 hover:bg-white/10"
            >
              Instagram
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="mailto:hey@vidlik.dk"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-base text-white/90 hover:bg-white/10"
            >
              Написати нам
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1012] p-6">
          <h3 className="mb-2 text-lg font-semibold">Мапа міст</h3>
          <p className="text-white/70">
            Маєш бажання зробити івент у своєму місті? Напиши нам — допоможемо з
            організацією, промо та всім необхідним.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
            <MapPinned className="h-4 w-4" />
            Копенгаген • Орхус • Оденсе • Олборг
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
