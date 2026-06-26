import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setAuthCookie } from "@/lib/auth-helpers";
import { hashEmailVerificationToken } from "@/lib/email-verification";

const renderHtml = (params: { title: string; message: string; ok: boolean }) => {
  const { title, message, ok } = params;
  const accent = ok ? "#98ff22" : "#ff6b6b";
  const bg = "#0b0c0f";
  const text = "#f3f4f6";

  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          body { margin:0; min-height:100vh; background:${bg}; color:${text}; font-family: system-ui, -apple-system, sans-serif; display:flex; align-items:center; justify-content:center; padding:24px; }
          .card { max-width:560px; width:100%; border:1px solid rgba(255,255,255,0.08); background:#111318; border-radius:18px; padding:32px 32px 28px; box-shadow:0 22px 70px rgba(0,0,0,0.28); }
          .title { font-size:24px; font-weight:800; margin:6px 0 12px; color:${accent}; letter-spacing: -0.2px; }
          .msg { font-size:16px; line-height:1.7; margin:0 0 22px; color:#e5e7eb; }
          .badge { display:inline-flex; align-items:center; gap:8px; background:${ok ? "rgba(152,255,34,0.08)" : "rgba(255,107,107,0.1)"}; color:${accent}; border:1px solid ${ok ? "rgba(152,255,34,0.3)" : "rgba(255,107,107,0.35)"}; padding:9px 14px; border-radius:10px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.7px; }
          a.btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:13px 18px; background:${accent}; color:#0b0c0f; border-radius:12px; font-weight:800; text-decoration:none; box-shadow:0 0 20px ${accent}55; transition:transform 160ms ease, box-shadow 160ms ease; }
          a.btn:hover { transform:translateY(-1px); box-shadow:0 0 26px ${accent}77; }
          .stack { display:flex; flex-direction:column; gap:10px; }
        </style>
      </head>
      <body>
        <main class="card">
          <div class="stack">
            <div class="badge">${ok ? "Підтверджено" : "Помилка"}</div>
            <h1 class="title">${title}</h1>
            <p class="msg">${message}</p>
            <a class="btn" href="/">Повернутися на сайт</a>
          </div>
        </main>
      </body>
    </html>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=UTF-8" } }
  );
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return renderHtml({
      ok: false,
      title: "Некоректний токен",
      message: "У посиланні відсутній токен підтвердження.",
    });
  }

  const tokenHash = hashEmailVerificationToken(token);
  const user = await prisma.user.findFirst({
    where: { emailVerificationTokenHash: tokenHash },
    select: {
      id: true,
      emailVerificationTokenExpiresAt: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) {
    return renderHtml({
      ok: false,
      title: "Посилання недійсне",
      message: "Це посилання недійсне або вже використане.",
    });
  }

  if (
    !user.emailVerificationTokenExpiresAt ||
    user.emailVerificationTokenExpiresAt.getTime() < Date.now()
  ) {
    return renderHtml({
      ok: false,
      title: "Посилання прострочене",
      message: "Посилання прострочене. Попросіть новий лист підтвердження.",
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    },
  });

  const response = renderHtml({
    ok: true,
    title: "Email підтверджено",
    message: "Ваш акаунт підтверджено. Можете користуватися Vidlik.",
  });
  setAuthCookie(response, createSessionToken(user.id));
  return response;
}
