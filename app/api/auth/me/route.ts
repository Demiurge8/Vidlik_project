import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Користувач не авторизований." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("Session lookup error", error);
    return NextResponse.json(
      { ok: false, error: "Не вдалося завантажити сесію." },
      { status: 500 }
    );
  }
}
