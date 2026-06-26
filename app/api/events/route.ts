import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getClientKey,
  rateLimit,
  rejectIfDisallowedOrigin,
} from "@/lib/security";
import { geocodeAddress } from "@/lib/geocode";

type EventPayloadData = {
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  address: string | null;
  timezone: string;
  category: string | null;
  summary: string | null;
  description: string | null;
  tags: string[];
  capacity: number | null;
  spotsLeft: number | null;
  host: string | null;
  registrationUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
};

const baseSelect = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  city: true,
  country: true,
  venue: true,
  address: true,
  timezone: true,
  category: true,
  summary: true,
  description: true,
  tags: true,
  capacity: true,
  spotsLeft: true,
  host: true,
  registrationUrl: true,
  latitude: true,
  longitude: true,
  isActive: true,
};

const ensureAdmin = async () => {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Не авторизовано", status: 401 as const };
  }
  if (user.role !== "admin") {
    return { error: "Доступ лише для адміністратора", status: 403 as const };
  }
  return { user };
};

const parseEventPayload = (
  body: Record<string, unknown>
): { data: EventPayloadData } | { error: string } => {
  const title =
    typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  const startsAt =
    typeof body.startsAt === "string" ? new Date(body.startsAt) : null;
  const endsAt =
    typeof body.endsAt === "string" && body.endsAt
      ? new Date(body.endsAt)
      : null;

  if (!title || !startsAt || Number.isNaN(startsAt.getTime())) {
    return { error: "Вкажіть назву та коректну дату початку." };
  }

  const field = (key: keyof typeof body, max = 200) =>
    typeof body[key] === "string" && (body[key] as string).trim().length > 0
      ? (body[key] as string).trim().slice(0, max)
      : null;

  const numberField = (key: keyof typeof body) => {
    if (typeof body[key] === "number") return body[key] as number;
    if (typeof body[key] === "string" && (body[key] as string).trim() !== "") {
      const num = Number(body[key]);
      return Number.isNaN(num) ? null : num;
    }
    return null;
  };

  const tags =
    Array.isArray(body.tags) && body.tags.every((t) => typeof t === "string")
      ? (body.tags as string[])
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];

  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : true;

  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    return { error: "Закінчення не може бути раніше початку." };
  }

  const capacity = numberField("capacity");
  const spotsLeft = numberField("spotsLeft");

  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
    return { error: "Кількість місць має бути цілим невідʼємним числом." };
  }

  if (spotsLeft !== null && (!Number.isInteger(spotsLeft) || spotsLeft < 0)) {
    return {
      error: "Кількість вільних місць має бути цілим невідʼємним числом.",
    };
  }

  if (capacity !== null && spotsLeft !== null && spotsLeft > capacity) {
    return {
      error:
        "Вільних місць не може бути більше, ніж загальна кількість місць.",
    };
  }

  return {
    data: {
      title,
      startsAt: startsAt,
      endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null,
      city: field("city", 80),
      country: field("country", 80),
      venue: field("venue", 120),
      address: field("address", 200),
      timezone: field("timezone", 100) || "UTC",
      category: field("category", 120),
      summary: field("summary", 240),
      description: field("description", 4000),
      tags,
      capacity,
      spotsLeft,
      host: field("host", 120),
      registrationUrl: field("registrationUrl", 400),
      latitude:
        typeof body.latitude === "number"
          ? body.latitude
          : typeof body.latitude === "string" && body.latitude.trim() !== ""
          ? Number(body.latitude)
          : null,
      longitude:
        typeof body.longitude === "number"
          ? body.longitude
          : typeof body.longitude === "string" && body.longitude.trim() !== ""
          ? Number(body.longitude)
          : null,
      isActive,
    },
  };
};

const clampLocation = (data: EventPayloadData): EventPayloadData => {
  const lat =
    data.latitude != null && !Number.isNaN(data.latitude)
      ? data.latitude
      : null;
  const lon =
    data.longitude != null && !Number.isNaN(data.longitude)
      ? data.longitude
      : null;

  const validLat = lat != null && lat >= -90 && lat <= 90 ? lat : null;
  const validLon = lon != null && lon >= -180 && lon <= 180 ? lon : null;
  return { ...data, latitude: validLat, longitude: validLon };
};

const ensureCoordinates = async (data: EventPayloadData) => {
  if (data.latitude != null && data.longitude != null) return data;

  const parts = [
    data.venue,
    data.address,
    data.city,
    data.country,
  ].filter(Boolean) as string[];
  if (parts.length === 0) return data;

  const query = parts.join(", ");
  const result = await geocodeAddress(query);
  if (!result) return data;

  return {
    ...data,
    latitude: result.lat,
    longitude: result.lon,
  };
};

export async function GET(req: Request) {
  const session = await getSessionUser();
  const isAdmin = session?.role === "admin";
  const url = new URL(req.url);
  const includeAll = isAdmin && url.searchParams.get("all") === "1";
  const scope = url.searchParams.get("scope") || "upcoming";
  const now = new Date();
  const pageParam = Number(url.searchParams.get("page") || "1");
  const limitParam = Number(url.searchParams.get("limit") || "0");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const limitRaw =
    Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 0;
  const limit =
    scope === "past"
      ? Math.min(limitRaw || 9, 50)
      : Math.min(limitRaw, 50);

  try {
    const baseWhere = includeAll ? {} : { isActive: true };
    const dateWhere =
      scope === "past"
        ? {
            OR: [
              { endsAt: { lt: now } },
              { endsAt: null, startsAt: { lt: now } },
            ],
          }
        : {
            OR: [
              { endsAt: { gte: now } },
              { endsAt: null, startsAt: { gte: now } },
            ],
          };

    const shouldPaginate = scope === "past" && limit > 0;
    const skip = shouldPaginate ? (page - 1) * limit : undefined;
    const take = shouldPaginate ? limit : undefined;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { ...baseWhere, ...dateWhere },
        orderBy: { startsAt: scope === "past" ? "desc" : "asc" },
        select: baseSelect,
        skip,
        take,
      }),
      shouldPaginate
        ? prisma.event.count({ where: { ...baseWhere, ...dateWhere } })
        : Promise.resolve(0),
    ]);

    if (!shouldPaginate) {
      return NextResponse.json({ events });
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return NextResponse.json({
      events,
      meta: {
        page,
        pageSize: limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Events list error", error);
    return NextResponse.json(
      { error: "Не вдалося завантажити події" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const originRejection = rejectIfDisallowedOrigin(req);
  if (originRejection) return originRejection;

  const limitKey = `events:create:${getClientKey(req)}`;
  const limit = rateLimit(limitKey, 20, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Забагато запитів, спробуйте пізніше." },
      { status: 429 }
    );
  }

  const adminCheck = await ensureAdmin();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseEventPayload(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    let payload = clampLocation(parsed.data);

    payload = await ensureCoordinates(payload);

    const event = await prisma.event.create({
      data: payload,
      select: baseSelect,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create event error", error);
    return NextResponse.json(
      { error: "Не вдалося створити подію" },
      { status: 500 }
    );
  }
}
