"use client";

/**
 * Typed fetch client for the NestJS backend.
 *
 * - Attaches the JWT access token as a Bearer header when present.
 * - On a 401 it transparently calls /auth/refresh (single-flight, so parallel
 *   requests share one refresh roundtrip) and retries the original request.
 * - If the refresh fails the session is cleared and the user is sent to /login.
 * - Normalizes NestJS error responses ({ statusCode, message }) into an
 *   ApiError with a readable message.
 */

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateTokens,
} from "@/lib/auth-storage";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Shared in-flight refresh promise so concurrent 401s only refresh once. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    if (!data?.accessToken) return false;

    updateTokens(data.accessToken, data.refreshToken ?? refreshToken);
    return true;
  } catch {
    return false;
  }
}

function handleSessionExpired(): never {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
  throw new ApiError(401, "Your session has expired. Please sign in again.");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  allowRetry = true
): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // Access token expired → try one silent refresh + retry.
  if (res.status === 401 && allowRetry && !path.startsWith("/auth/")) {
    refreshInFlight ??= refreshTokens().finally(() => {
      refreshInFlight = null;
    });
    const refreshed = await refreshInFlight;

    if (!refreshed) handleSessionExpired();
    return apiFetch<T>(path, options, false);
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      const raw = data?.message ?? data?.error;
      if (raw) {
        message = Array.isArray(raw) ? raw.join(", ") : String(raw);
      }
    } catch {
      // keep default message
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

/** POST/PUT helper with a JSON body. */
export function apiSend<T>(
  path: string,
  method: "POST" | "PUT",
  body: unknown
): Promise<T> {
  return apiFetch<T>(path, {
    method,
    body: JSON.stringify(body),
  });
}
