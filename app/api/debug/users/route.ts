import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Недостатньо прав." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { id: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, users });
  } catch (error) {
    console.error("Debug /users error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
