"use client";

/**
 * Auth context — wraps the NestJS /auth endpoints (register, login, logout,
 * refresh) and exposes the signed-in user to the rest of the app.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveSession,
  syncSessionCookie,
} from "@/lib/auth-storage";
import type { AuthUser, JwtPayload, LoginResponse } from "@/lib/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (username: string, password: string, redirectTo?: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeUser(token: string): AuthUser {
  const payload = jwtDecode<JwtPayload>(token);
  return { id: payload.sub, username: payload.username, role: payload.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const router = useRouter();

  /** Hydrate the session from storage on first paint. */
  useEffect(() => {
    const token = getAccessToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      setStatus("unauthenticated");
      return;
    }

    // Restore the proxy-visible cookie in case it expired while tokens remain.
    syncSessionCookie();

    const payload = jwtDecode<JwtPayload>(token);
    const expired = payload.exp !== undefined && payload.exp * 1000 <= Date.now();

    if (!expired) {
      setUser(storedUser);
      setStatus("authenticated");
      return;
    }

    // Access token expired — try a silent refresh before kicking the user out.
    (async () => {
      try {
        const data = await apiFetch<LoginResponse>("/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: getRefreshToken() }),
        });
        if (!data?.accessToken) throw new Error("No token returned");
        const refreshedUser = decodeUser(data.accessToken);
        saveSession(data.accessToken, data.refreshToken, refreshedUser);
        setUser(refreshedUser);
        setStatus("authenticated");
      } catch {
        clearSession();
        setStatus("unauthenticated");
      }
    })();
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string,
      redirectTo: string = "/dashboard"
    ) => {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // The backend answers invalid credentials with HTTP 200 + { error }.
      if (data?.error) {
        throw new Error(data.error);
      }
      if (!data?.accessToken) {
        throw new Error("Login failed — no token received from the server.");
      }

      const loggedInUser = decodeUser(data.accessToken);
      saveSession(data.accessToken, data.refreshToken, loggedInUser);
      setUser(loggedInUser);
      setStatus("authenticated");
      toast.success(`Welcome back, ${loggedInUser.username}!`);
      router.push(redirectTo);
    },
    [router]
  );

  const register = useCallback(
    async (username: string, password: string) => {
      await apiFetch<{ id: number; username: string; role: string }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ username, password }),
        }
      );
      // Registration succeeds → sign the new user in right away.
      await login(username, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    const currentUser = user ?? getStoredUser();
    if (currentUser) {
      try {
        // Best effort — revokes the refresh token server-side.
        await apiFetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ userId: currentUser.id }),
        });
      } catch {
        // Ignore network failures on logout; the local session is cleared below.
      }
    }
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/login");
  }, [router, user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }
  return ctx;
}
