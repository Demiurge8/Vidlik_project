import { NextResponse } from "next/server";
import {
  createSessionToken,
  findUserByEmail,
  setAuthCookie,
  toSafeUser,
  verifyPassword,
} from "@/lib/auth-helpers";
import { getClientKey, rateLimit, rejectIfDisallowedOrigin } from "@/lib/security";

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  const originRejection = rejectIfDisallowedOrigin(req);
  if (originRejection) return originRejection;

  const limitKey = `login:${getClientKey(req)}`;
  const limit = rateLimit(limitKey, 8, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Забагато спроб, зачекайте трохи." },
      { status: 429 }
    );
  }

  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const normalizedEmail = email?.trim().toLowerCase();

    const plainPassword = password?.trim() ?? "";

    if (
      !normalizedEmail ||
      !plainPassword ||
      !isEmail(normalizedEmail) ||
      plainPassword.length < MIN_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        { ok: false, error: "Вкажіть коректні email та пароль." },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { ok: false, error: "Невірний email або пароль." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(plainPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Невірний email або пароль." },
        { status: 401 }
      );
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Підтвердіть email у листі, щоб увійти до акаунту.",
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ ok: true, user: toSafeUser(user) });
    setAuthCookie(response, createSessionToken(user.id));
    return response;
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json(
      { ok: false, error: "Не вдалося увійти. Спробуйте пізніше." },
      { status: 500 }
    );
  }
}
