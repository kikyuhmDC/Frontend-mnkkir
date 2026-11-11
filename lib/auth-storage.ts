"use client";

/**
 * Token storage for the NestJS JWT auth flow.
 *
 * - Access + refresh tokens live in localStorage (read by the API client so
 *   every request can attach an `Authorization: Bearer …` header).
 * - A lightweight `orderly_session` cookie mirrors the session so the Next.js
 *   proxy (proxy.ts) can optimistically guard /dashboard routes server-side
 *   without exposing the tokens themselves.
 */

import type { AuthUser } from "@/lib/types";

const ACCESS_TOKEN_KEY = "orderly.accessToken";
const REFRESH_TOKEN_KEY = "orderly.refreshToken";
const USER_KEY = "orderly.user";
export const SESSION_COOKIE = "orderly_session";

/** Refresh tokens are valid for 7 days on the backend; keep the marker in sync. */
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(
  accessToken: string,
  refreshToken: string,
  user: AuthUser
): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  syncSessionCookie();
}

export function updateTokens(accessToken: string, refreshToken: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  syncSessionCookie();
}

/** Keep the proxy-visible session cookie in sync with localStorage. */
export function syncSessionCookie(): void {
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearSession(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  // Expire the marker cookie.
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
