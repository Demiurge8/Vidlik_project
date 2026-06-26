import {
  CalendarHeart,
  Users,
  Sparkles,
  Handshake,
} from "lucide-react";
import { RevealSection } from "./RevealSection";

const missionCards = [
  {
    icon: CalendarHeart,
    label: "Івенти та зустрічі",
    text: "Від чіл-зборів до активних подій і воркшопів.",
  },
  {
    icon: Users,
    label: "Нові друзі",
    text: "Ком'юніті, в якому комфортно бути собою.",
  },
  {
    icon: Sparkles,
    label: "Підтримка ідей",
    text: "Дамо поштовх творчим проєктам та ініціативам.",
  },
  {
    icon: Handshake,
    label: "Жива інтеграція",
    text: "Розвиваємо діалог культур — без примусу й стресу.",
  },
];

export function Mission() {
  return (
    <RevealSection
      id="mission"
      className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20"
      aria-labelledby="mission-title"
    >
      <div className="grid gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 md:grid-cols-2 md:p-12">
        <div className="space-y-4">
          <h2
            id="mission-title"
            className="text-3xl font-bold tracking-tight"
          >
            Ми — Vidlik Community
          </h2>
          <p className="text-white/75">
            Ми створені для української молоді в Данії — для тих, хто шукає
            друзів, підтримку й можливість почуватися
            <span className="text-white/95"> “на своєму місці”.</span>
          </p>
          <p className="text-white/70">
            Ми знаємо, як іноді складно знайти себе у новому середовищі: інша
            мова, інші традиції, інший ритм життя. Тому Vidlik допомагає
            адаптуватися, знайомитися, знаходити натхнення й розвиватися.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {missionCards.map(({ icon: Icon, label, text }) => (
            <li
              key={label}
              className="group rounded-2xl border border-white/10 bg-[#0f1012] p-5 transition hover:border-[#98ff22]/60"
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-[#98ff22]/40 bg-[#98ff22]/10 px-2 py-1 text-xs text-[#98ff22]">
                <Icon className="h-5 w-5" />
                {label}
              </div>
              <p className="text-white/80">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </RevealSection>
  );
}
