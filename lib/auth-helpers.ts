// lib/auth-helpers.ts
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const AUTH_COOKIE_NAME = "vidlik_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SafeUser = {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
  pointsBalance: number;
  createdAt: Date;
};

const base64UrlEncode = (input: string | Buffer) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlToBuffer = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
};

const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET env var is missing");
  }
  return secret;
};

const signPayload = (payload: Record<string, unknown>) => {
  const header = { alg: "HS256", typ: "JWT" };
  const body = JSON.stringify(payload);
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(body);
  const data = `${encodedHeader}.${encodedPayload}`;
  const hmac = crypto.createHmac("sha256", getAuthSecret());
  hmac.update(data);
  const signature = base64UrlEncode(hmac.digest());
  return `${data}.${signature}`;
};

const verifyToken = (token: string) => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const hmac = crypto.createHmac("sha256", getAuthSecret());
  hmac.update(data);
  const expected = base64UrlEncode(hmac.digest());

  const actualBuf = base64UrlToBuffer(signature);
  const expectedBuf = base64UrlToBuffer(expected);
  if (
    actualBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(actualBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      base64UrlToBuffer(payload).toString("utf8")
    ) as { sub?: number; exp?: number };
    if (!decoded.exp || decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
};

export const hashPassword = (password: string) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const toSafeUser = (user: User): SafeUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role === "ADMIN" ? "admin" : "user",
  pointsBalance: user.pointsBalance,
  createdAt: user.createdAt,
});

export const createSessionToken = (userId: number) => {
  const now = Math.floor(Date.now() / 1000);
  return signPayload({
    sub: userId,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  });
};

export const setAuthCookie = (response: NextResponse, token: string) => {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
};

export const clearAuthCookie = (response: NextResponse) => {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
};

export const getSessionUser = async (): Promise<SafeUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
  });

  return user ? toSafeUser(user) : null;
};
