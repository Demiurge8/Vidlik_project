"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionUser = {
  id: number;
  name: string | null;
  email: string;
  role: "user" | "admin";
  pointsBalance: number;
  createdAt?: string;
};

const SESSION_CACHE_KEY = "vidlik-auth-session";

const isBrowser = () => typeof window !== "undefined";

const readCache = (): SessionUser | null => {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(SESSION_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.id !== "number" ||
      typeof parsed.email !== "string"
    ) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name ?? null,
      role: parsed.role ?? "user",
      pointsBalance: parsed.pointsBalance ?? 0,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
};

const writeCache = (user: SessionUser | null) => {
  if (!isBrowser()) return;
  if (user) {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_CACHE_KEY);
  }
};

export const fetchSession = async (): Promise<SessionUser | null> => {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { ok: boolean; user?: SessionUser };
    return data.ok ? data.user ?? null : null;
  } catch {
    return null;
  }
};

export const logout = async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore network errors on logout
  } finally {
    writeCache(null);
  }
};

export function useSession() {
  const [session, setSessionState] = useState<SessionUser | null>(() =>
    readCache()
  );
  const [hydrated, setHydrated] = useState(false);

  const setSession = useCallback((value: SessionUser | null) => {
    setSessionState(value);
    writeCache(value);
  }, []);

  const refresh = useCallback(async () => {
    const user = await fetchSession();
    setSession(user);
    setHydrated(true);
    return user;
  }, [setSession]);

  useEffect(() => {
    let cancelled = false;

    fetchSession().then((user) => {
      if (cancelled) return;
      setSession(user);
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [setSession]);

  return { session, hydrated, setSession, refresh };
}
