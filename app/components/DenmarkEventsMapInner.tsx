"use client";

import { Fragment } from "react";
import type { ComponentType } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { MapPin, X } from "lucide-react";

type LeafletComponent = ComponentType<Record<string, unknown>>;

const LeafletMap = MapContainer as unknown as LeafletComponent;
const LeafletTileLayer = TileLayer as unknown as LeafletComponent;
const LeafletCircleMarker = CircleMarker as unknown as LeafletComponent;
const LeafletTooltip = Tooltip as unknown as LeafletComponent;

export type CityEvent = {
  id: string;
  date: string;
  title: string;
};

export type City = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  eventsCount: number;
  events?: CityEvent[];
};

type Props = {
  cities: City[];
  activeId: string | null;
  onChange: (id: string | null) => void;
};

const DENMARK_BOUNDS: [[number, number], [number, number]] = [
  [53.8, 6.5],
  [58.5, 14.0],
];

const EMPTY_CITY: City = {
  id: "empty",
  name: "",
  lat: 0,
  lon: 0,
  eventsCount: 0,
};

export function DenmarkEventsMapInner({ cities, activeId, onChange }: Props) {
  const markers = cities.length > 0 ? cities : [EMPTY_CITY];

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-transparent md:aspect-[4/3] lg:aspect-square">
      <LeafletMap
        center={[56.0, 10.5]}
        zoom={6}
        minZoom={6}
        maxZoom={8}
        scrollWheelZoom={true}
        dragging={true}
        className="absolute inset-0 h-full w-full"
        zoomControl={false}
        attributionControl={false}
        maxBounds={DENMARK_BOUNDS}
      >
        <LeafletTileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          className="map-brightness"
        />

        {markers.map((city) => {
          const isActive = activeId != null && city.id === activeId;

          return (
            <Fragment key={city.id}>
              {isActive && (
                <LeafletCircleMarker
                  center={[city.lat, city.lon]}
                  radius={20}
                  pathOptions={{
                    color: "rgba(152,255,34,0.45)",
                    weight: 2,
                    fillColor: "rgba(152,255,34,0.12)",
                    fillOpacity: 0.8,
                  }}
                  interactive={false}
                />
              )}

              <LeafletCircleMarker
                center={[city.lat, city.lon]}
                radius={isActive ? 10 : 7}
                pathOptions={{
                  color: isActive ? "#c0ff4b" : "#98ff22",
                  weight: isActive ? 4 : 2,
                  fillColor: "#98ff22",
                  fillOpacity: isActive ? 0.95 : 0.85,
                }}
                eventHandlers={{
                  click: () => onChange(city.id),
                }}
              >
                {isActive && (
                  <LeafletTooltip
                    direction="top"
                    offset={[0, -11]}
                    opacity={1}
                    permanent={true}
                    interactive={true}
                    className="!rounded-2xl !border !border-[#98ff22]/70 !bg-black/90 !px-4 !py-3 !text-xs !text-white shadow-[0_0_24px_rgba(152,255,34,0.6)]"
                  >
                    <div className="relative flex flex-col gap-2">
                      <button
                        type="button"
                        className="absolute right-0 top-0 cursor-pointer rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white/80"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onChange(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>

                      <div className="flex items-center gap-2 pr-5">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#98ff22]" />
                        <span className="font-semibold text-[#98ff22]">
                          {city.name}
                        </span>
                      </div>

                      <div className="text-[0.7rem] text-white/75">
                        {city.eventsCount > 0
                          ? `${city.eventsCount} подій скоро`
                          : "Ще немає подій у місті"}
                      </div>

                      {city.events && city.events.length > 0 && (
                        <div className="scrollbar-hide mt-1 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                          {city.events.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-2 text-[0.72rem]"
                            >
                              <span className="inline-flex items-center justify-center rounded-full border border-[#98ff22]/70 bg-[#98ff22]/10 px-2 py-0.5 font-semibold text-[#98ff22]">
                                {event.date}
                              </span>
                              <span className="text-white/85">
                                {event.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <a
                        href="#events"
                        className="pt-1 text-[0.7rem] font-medium !text-[#98ff22] hover:!text-[#80e70a]"
                      >
                        Дивитися події міста →
                      </a>
                    </div>
                  </LeafletTooltip>
                )}
              </LeafletCircleMarker>
            </Fragment>
          );
        })}
      </LeafletMap>

      <div className="pointer-events-none absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs text-white/60 backdrop-blur">
        <MapPin className="h-3.5 w-3.5 text-[#98ff22]" />
        <span className="leading-none">Данія • карта подій Vidlik</span>
      </div>
    </div>
  );
}
