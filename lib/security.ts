import { NextResponse } from "next/server";

type RateEntry = { count: number; resetAt: number };
const RATE_STORE: Map<string, RateEntry> = new Map();

export const getClientKey = (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
};

export const rateLimit = (
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } => {
  const now = Date.now();
  const current = RATE_STORE.get(key);

  if (current && current.resetAt > now) {
    if (current.count >= limit) {
      return {
        allowed: false,
        retryAfter: Math.ceil((current.resetAt - now) / 1000),
      };
    }
    current.count += 1;
    RATE_STORE.set(key, current);
    return { allowed: true };
  }

  RATE_STORE.set(key, { count: 1, resetAt: now + windowMs });
  return { allowed: true };
};

export const originAllowed = (req: Request) => {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = new URL(req.url).host;
    return originHost === requestHost;
  } catch {
    return false;
  }
};

export const rejectIfDisallowedOrigin = (req: Request) => {
  if (originAllowed(req)) return null;
  return NextResponse.json(
    { error: "Недопустиме джерело запиту." },
    { status: 403 }
  );
};
