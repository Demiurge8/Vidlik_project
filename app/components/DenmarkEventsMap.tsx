"use client";

import dynamic from "next/dynamic";
import type { City } from "./DenmarkEventsMapInner";

// динамічно імпортуємо внутрішню карту ТІЛЬКИ на клієнті
const DenmarkEventsMapInner = dynamic(
  () =>
    import("./DenmarkEventsMapInner").then(
      (mod) => mod.DenmarkEventsMapInner
    ),
  {
    ssr: false,
  }
);

export type { City };

type Props = {
  cities: City[];
  activeId: string | null;
  onChange: (id: string | null) => void;
};

export function DenmarkEventsMap(props: Props) {
  return <DenmarkEventsMapInner {...props} />;
}
