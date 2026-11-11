"use client";

/**
 * Sign-in page — posts credentials to the NestJS /auth/login endpoint and
 * stores the returned access/refresh tokens (see components/auth-provider).
 */

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  ListOrderedIcon,
  Loader2Icon,
  LogInIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Cannot reach the Orderly API. Make sure the NestJS backend is running on port 3000.";
  }
  return message;
}

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const target = nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard";
      await login(username.trim(), password, target);
      // Redirect is handled by the provider.
    } catch (err) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ListOrderedIcon className="size-5" />
        </span>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your Orderly account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive"
            >
              <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="mt-1">
            {submitting ? (
              <>
                <Loader2Icon className="animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <LogInIcon /> Sign in
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center gap-1 text-sm text-muted-foreground">
        No account yet?
        <Button variant="link" size="sm" nativeButton={false} render={<Link href="/register" />}>
          Create one
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-1 flex-col items-center justify-center gap-4 bg-muted/40 px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ListOrderedIcon className="size-4" />
        </span>
        <span className="font-heading font-semibold">Orderly</span>
      </Link>
      <Suspense
        fallback={
          <div className="flex w-full max-w-sm items-center justify-center py-16 text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <Separator className="w-full max-w-sm" />
      <p className="max-w-sm text-center text-xs leading-5 text-muted-foreground">
        Demo account —{" "}
        <code className="font-mono">admin</code> /{" "}
        <code className="font-mono">admin123</code>. Tokens are issued by the
        NestJS backend and refreshed automatically.
      </p>
    </div>
  );
}
