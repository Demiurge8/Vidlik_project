"use client";

import { RevealSection } from "./RevealSection";
import { Music, Lightbulb, Rocket } from "lucide-react";

const items = [
  {
    icon: Music,
    title: "Тематичні івенти",
    text: "Мюзік- та кіно-ніч, настолки, open mic, тематичні вечори й більше.",
  },
  {
    icon: Lightbulb,
    title: "Воркшопи та розвиток",
    text: "Від мови й кар'єри до креативу. Навчаємося разом і підтримуємо одне одного.",
  },
  {
    icon: Rocket,
    title: "Підтримка ініціатив",
    text: "Допомагаємо з ідеями учасників: від пілоту до події й промо всередині Данії.",
  },
];

export function WhatWeDo() {
  return (
    <RevealSection
      id="what"
      className="scroll-mt-24 mx-auto max-w-7xl px-4 pb-20"
      aria-labelledby="what-title"
    >
      <h2
        id="what-title"
        className="mb-8 text-3xl font-bold tracking-tight"
      >
        Що ми робимо
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="group rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#98ff22]/50 bg-[#98ff22]/10">
              <item.icon className="h-6 w-6 text-[#98ff22]" />
            </div>
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="mt-2 text-white/70">{item.text}</p>
            <div className="mt-6 h-1 w-1/3 rounded-full bg-gradient-to-r from-[#98ff22] to-transparent opacity-60" />
          </div>
        ))}
      </div>
    </RevealSection>
  );
}
