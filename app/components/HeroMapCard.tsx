"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { DenmarkEventsMap, type City } from "./DenmarkEventsMap";

type EventApiItem = {
  id: number;
  title: string;
  startsAt: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Location = City & { description?: string };

const formatDateShort = (iso: string, timeZone = "Europe/Copenhagen") =>
  new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
  }).format(new Date(iso));

export function HeroMapCard() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        if (!res.ok) throw new Error("Не вдалося завантажити події");
        const data = (await res.json()) as { events: EventApiItem[] };
        setEvents(data.events);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Сталася помилка завантаження"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const cities: Location[] = useMemo(() => {
    const grouped: Record<
      string,
      {
        name: string;
        lat: number;
        lon: number;
        events: { id: string; date: string; title: string }[];
      }
    > = {};

    for (const event of events) {
      if (
        event.latitude == null ||
        event.longitude == null ||
        Number.isNaN(event.latitude) ||
        Number.isNaN(event.longitude)
      ) {
        continue;
      }
      const cityName = event.city?.trim() || "Подія";
      const key =
        cityName.toLowerCase() || `${event.latitude.toFixed(3)}-${event.longitude.toFixed(3)}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: cityName,
          lat: event.latitude,
          lon: event.longitude,
          events: [],
        };
      }
      // if group exists without coords (shouldn't), keep first coords
      if (Number.isNaN(grouped[key].lat) || Number.isNaN(grouped[key].lon)) {
        grouped[key].lat = event.latitude;
        grouped[key].lon = event.longitude;
      }
      grouped[key].events.push({
        id: String(event.id),
        date: formatDateShort(event.startsAt),
        title: event.title,
      });
    }

    return Object.entries(grouped).map(([id, value]) => {
      const eventsSorted = [...value.events].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      return {
        id,
        name: value.name,
        lat: value.lat,
        lon: value.lon,
        eventsCount: eventsSorted.length,
        events: eventsSorted,
        description: undefined,
      };
    });
  }, [events]);

  return (
    <div
      className="
        relative mx-auto w-full
        max-w-[480px] md:max-w-[520px] lg:max-w-[500px]
        rounded-3xl border border-[#98ff22]/30
        bg-gradient-to-br from-[#98ff22]/18 via-[#98ff22]/5 to-transparent
        p-4 sm:p-5
        shadow-[0_0_50px_rgba(152,255,34,0.25)]
      "
    >
      <div className="relative rounded-2xl overflow-hidden">
        {loading ? (
          <div className="aspect-[4/3] md:aspect-[4/3] lg:aspect-square grid place-items-center bg-black/40 text-white/60 text-sm">
            Завантаження карти...
          </div>
        ) : error ? (
          <div className="aspect-[4/3] md:aspect-[4/3] lg:aspect-square grid place-items-center bg-black/40 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <DenmarkEventsMap
            cities={cities}
            activeId={activeId}
            onChange={setActiveId}
          />
        )}
      </div>
    </div>
  );
}
