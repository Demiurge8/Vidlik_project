import { resolveMx } from "dns/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  findUserByEmail,
  hashPassword,
} from "@/lib/auth-helpers";
import {
  generateEmailVerificationToken,
  getEmailVerificationExpiresAt,
  hashEmailVerificationToken,
  sendEmailVerification,
} from "@/lib/email-verification";
import { getClientKey, rateLimit, rejectIfDisallowedOrigin } from "@/lib/security";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const EMAIL_DOMAIN_LABEL_REGEX =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const PASSWORD_ASCII_REGEX = /^[\x21-\x7E]+$/;
const DOMAIN_CACHE_TTL_MS = 10 * 60 * 1000;
const DOMAIN_CHECK_TIMEOUT_MS = 2500;
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 80;

const domainCache = new Map<string, { ok: boolean; expiresAt: number }>();

const isEmailDomainSyntaxValid = (domain: string) => {
  if (!domain || domain.length > 253) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1];
  if (!tld || tld.length < 2 || tld.length > 63) return false;
  return labels.every((label) => EMAIL_DOMAIN_LABEL_REGEX.test(label));
};

const isEmail = (value: string) => {
  if (!EMAIL_REGEX.test(value)) return false;
  const domain = value.split("@")[1] ?? "";
  return isEmailDomainSyntaxValid(domain);
};

const isAsciiPassword = (value: string) => PASSWORD_ASCII_REGEX.test(value);

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

const hasMxRecords = async (domain: string) => {
  const mx = await resolveMx(domain).catch(() => []);
  return mx.length > 0;
};

const isEmailDomainValid = async (domain: string) => {
  const cached = domainCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) return cached.ok;
  const ok = await hasMxRecords(domain);
  domainCache.set(domain, { ok, expiresAt: Date.now() + DOMAIN_CACHE_TTL_MS });
  return ok;
};

export async function POST(req: Request) {
  const originRejection = rejectIfDisallowedOrigin(req);
  if (originRejection) return originRejection;

  const limitKey = `register:${getClientKey(req)}`;
  const limit = rateLimit(limitKey, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Забагато спроб реєстрації, спробуйте пізніше." },
      { status: 429 }
    );
  }

  try {
    const { email, password, name } = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string | null;
    };

    const trimmedEmail = email?.trim();
    const trimmedName =
      name && typeof name === "string" && name.trim().length > 0
        ? name.trim().slice(0, MAX_NAME_LENGTH)
        : null;
    const trimmedPassword = password?.trim() || "";

    if (!trimmedEmail || !isEmail(trimmedEmail)) {
      return NextResponse.json(
        { ok: false, error: "Вкажіть коректний email." },
        { status: 400 }
      );
    }

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          error: `Пароль має містити щонайменше ${MIN_PASSWORD_LENGTH} символів.`,
        },
        { status: 400 }
      );
    }

    if (!isAsciiPassword(trimmedPassword)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Пароль має містити лише латинські літери, цифри та символи.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = trimmedEmail.toLowerCase();
    const emailDomain = normalizedEmail.split("@")[1] ?? "";

    try {
      const domainOk = await withTimeout(
        isEmailDomainValid(emailDomain),
        DOMAIN_CHECK_TIMEOUT_MS
      );
      if (!domainOk) {
        return NextResponse.json(
          { ok: false, error: "Домен email не приймає пошту." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Не вдалося перевірити домен email. Спробуйте ще раз.",
        },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Користувач з таким email вже існує." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(trimmedPassword);
    const verificationToken = generateEmailVerificationToken();
    const verificationTokenHash = hashEmailVerificationToken(verificationToken);
    const verificationExpiresAt = getEmailVerificationExpiresAt();

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: trimmedName,
        emailVerifiedAt: null,
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationTokenExpiresAt: verificationExpiresAt,
      } satisfies Prisma.UserCreateInput,
    });

    await sendEmailVerification({
      email: normalizedEmail,
      token: verificationToken,
    });

    return NextResponse.json(
      {
        ok: true,
        requiresVerification: true,
        devVerificationToken:
          process.env.NODE_ENV !== "production" ? verificationToken : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Не вдалося зареєструватися. Спробуйте пізніше.",
      },
      { status: 500 }
    );
  }
}
