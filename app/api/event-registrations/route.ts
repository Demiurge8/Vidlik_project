import crypto from "crypto";
import { resolve4, resolve6, resolveMx } from "dns/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getClientKey,
  rateLimit,
  rejectIfDisallowedOrigin,
} from "@/lib/security";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const MAX_NAME = 80;
const MAX_CONTACT = 120;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const DOMAIN_CACHE_TTL_MS = 10 * 60 * 1000;
const DOMAIN_CHECK_TIMEOUT_MS = 2500;

const domainCache = new Map<string, { ok: boolean; expiresAt: number }>();

const hashToken = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

const generateToken = () => crypto.randomBytes(32).toString("hex");

const getEventEnd = (event: { startsAt: Date; endsAt: Date | null }) =>
  new Date(event.endsAt ?? event.startsAt).getTime();

const sendConfirmationEmail = async ({
  email,
  eventTitle,
  token,
}: {
  email: string;
  eventTitle: string;
  token: string;
}) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";
  const confirmUrl = `${baseUrl}/api/event-registrations/confirm?token=${token}`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Vidlik <no-reply@vidlik.dk>";

  if (!apiKey) {
    console.info("[registration] confirmation link (no mailer configured)", {
      email,
      eventTitle,
      confirmUrl,
    });
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Підтвердіть реєстрацію на ${eventTitle}`,
        html: `
          <p>Ви залишили заявку на подію <strong>${eventTitle}</strong>.</p>
          <p>Щоб підтвердити, перейдіть за посиланням:</p>
          <p><a href="${confirmUrl}" target="_blank">${confirmUrl}</a></p>
          <p>Якщо це були не ви — просто проігноруйте лист.</p>
        `,
        text: `Підтвердіть реєстрацію на ${eventTitle}: ${confirmUrl}`,
      }),
    });
  } catch (err) {
    console.error("resend email error", err);
    // Не роняємо флоу: заявка лишається PENDING, користувачу не падає 500.
  }
};

type Body = {
  eventId?: unknown;
  name?: unknown;
  email?: unknown;
  contact?: unknown;
  honeypot?: unknown;
};

const normalizeString = (value: unknown, max: number) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) => {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const hasMxOrAddress = async (domain: string) => {
  const mx = await resolveMx(domain).catch(() => []);
  if (mx.length > 0) return true;
  const a = await resolve4(domain).catch(() => []);
  if (a.length > 0) return true;
  const aaaa = await resolve6(domain).catch(() => []);
  return aaaa.length > 0;
};

const isEmailDomainValid = async (domain: string) => {
  const cached = domainCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) return cached.ok;
  const ok = await hasMxOrAddress(domain);
  domainCache.set(domain, { ok, expiresAt: Date.now() + DOMAIN_CACHE_TTL_MS });
  return ok;
};

export async function POST(req: Request) {
  const originRejection = rejectIfDisallowedOrigin(req);
  if (originRejection) return originRejection;

  const limitKey = `event-registration:${getClientKey(req)}`;
  // Дозволяємо більше спроб, а для авторизованих — без ліміту.
  const session = await getSessionUser().catch(() => null);
  if (!session) {
    const limit = rateLimit(limitKey, 30, 5 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Забагато спроб. Спробуйте пізніше." },
        { status: 429 }
      );
    }
  }

  try {
    const body = (await req.json()) as Body;

    if (body.honeypot && typeof body.honeypot === "string") {
      return NextResponse.json(
        { error: "Помилка перевірки форми." },
        { status: 400 }
      );
    }

    const eventId = Number(body.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return NextResponse.json(
        { error: "Невалідна подія." },
        { status: 400 }
      );
    }

    const name = normalizeString(body.name, MAX_NAME) || null;
    const emailRaw = normalizeString(body.email, 160);
    const contact = normalizeString(body.contact, MAX_CONTACT) || null;
    const email = emailRaw.toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Вкажіть коректний email." },
        { status: 400 }
      );
    }

    const emailDomain = email.split("@")[1] || "";
    try {
      const domainOk = await withTimeout(
        isEmailDomainValid(emailDomain),
        DOMAIN_CHECK_TIMEOUT_MS
      );
      if (!domainOk) {
        return NextResponse.json(
          { error: "Email домен не існує або не приймає пошту." },
          { status: 400 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Не вдалося перевірити домен email. Спробуйте ще раз." },
        { status: 400 }
      );
    }

    const registrationEmail = email;
    const registrationName = name || session?.name || null;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, startsAt: true, endsAt: true, isActive: true },
    });

    if (!event || !event.isActive) {
      return NextResponse.json(
        { error: "Подія недоступна." },
        { status: 404 }
      );
    }

    if (getEventEnd(event) < Date.now()) {
      return NextResponse.json(
        { error: "Подія вже завершилася." },
        { status: 400 }
      );
    }

    let shouldAutoConfirm = false;
    if (session && session.email.toLowerCase() === registrationEmail) {
      const verifiedUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: { emailVerifiedAt: true },
      });
      shouldAutoConfirm = Boolean(verifiedUser?.emailVerifiedAt);
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_email: { eventId, email: registrationEmail },
      },
    });

    if (existing) {
      return NextResponse.json({
        status: "CONFIRMED",
        message: "Ви вже підтвердили участь.",
      });
    }

    if (shouldAutoConfirm) {
      await prisma.eventRegistrationRequest.deleteMany({
        where: { eventId, email: registrationEmail },
      });

      await prisma.eventRegistration.create({
        data: {
          eventId,
          userId: session?.id ?? null,
          name: registrationName,
          email: registrationEmail,
          contact,
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      return NextResponse.json({
        status: "CONFIRMED",
        message: "Реєстрацію підтверджено.",
      });
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    const pending = await prisma.eventRegistrationRequest.findUnique({
      where: {
        eventId_email: { eventId, email: registrationEmail },
      },
    });

    if (pending) {
      await prisma.eventRegistrationRequest.update({
        where: { id: pending.id },
        data: {
          name: registrationName,
          email: registrationEmail,
          contact,
          userId: session?.id ?? pending.userId,
          tokenHash,
          tokenExpiresAt,
        },
      });
    } else {
      await prisma.eventRegistrationRequest.create({
        data: {
          eventId,
          name: registrationName,
          email: registrationEmail,
          contact,
          userId: session?.id ?? null,
          tokenHash,
          tokenExpiresAt,
        },
      });
    }

    await sendConfirmationEmail({
      email: registrationEmail,
      eventTitle: event.title,
      token,
    });

    return NextResponse.json(
      {
        status: "PENDING",
        message: "Перевірте email, щоб підтвердити запис.",
        devConfirmationToken:
          process.env.NODE_ENV !== "production" ? token : undefined,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("event-registration error", error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Не вдалося обробити заявку."
            : `Не вдалося обробити заявку: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
      },
      { status: 500 }
    );
  }
}
