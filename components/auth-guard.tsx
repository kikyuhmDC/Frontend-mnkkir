"use client";

/**
 * Client-side route guard for the dashboard.
 *
 * The proxy (proxy.ts) already redirects unauthenticated requests away from
 * /dashboard based on the session cookie, but the cookie is only an
 * optimistic marker — this guard re-verifies the real session from the
 * AuthProvider and sends the user to /login when it is missing or expired.
 *
 * The guarded children always stay in the render tree (an opaque overlay
 * covers them while the session is being verified) so the segments remain
 * prerenderable and validatable for instant navigations.
 */

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import { useAuth } from "@/components/auth-provider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? "/dashboard")}`);
    }
  }, [status, router, pathname]);

  const verifying = status !== "authenticated";

  return (
    <>
      {verifying ? (
        <div
          aria-busy="true"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background"
        >
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {status === "unauthenticated"
              ? "Redirecting to sign-in…"
              : "Checking your session…"}
          </p>
        </div>
      ) : null}
      {children}
    </>
  );
}
