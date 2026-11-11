"use client";

/**
 * Registration page — creates an account via POST /auth/register and signs
 * the new user in immediately (the provider calls /auth/login afterwards).
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ListOrderedIcon,
  Loader2Icon,
  TriangleAlertIcon,
  UserPlusIcon,
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

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Cannot reach the Orderly API. Make sure the NestJS backend is running on port 3000.";
  }
  // MySQL duplicate-key errors surface as HTTP 500 from the register endpoint.
  if (/duplicate|already exists|ER_DUP_ENTRY/i.test(message)) {
    return "That username is already taken. Please choose another one.";
  }
  return message;
}

export default function RegisterPage() {
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!USERNAME_PATTERN.test(username)) {
      setError(
        "Username must be 3–30 characters (letters, numbers or underscores)."
      );
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register(username.trim(), password);
      // Auto-login + redirect handled by the provider.
    } catch (err) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

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

      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UserPlusIcon className="size-5" />
          </span>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            New accounts are registered through the NestJS API and signed in
            automatically.
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
                placeholder="e.g. maria_store"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
                  <Loader2Icon className="animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  <UserPlusIcon /> Create account
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center gap-1 text-sm text-muted-foreground">
          Already registered?
          <Button variant="link" size="sm" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
        </CardFooter>
      </Card>

      <Separator className="w-full max-w-sm" />
      <p className="max-w-sm text-center text-xs leading-5 text-muted-foreground">
        Accounts are stored in the MySQL database behind the NestJS API.
        Passwords are hashed with bcrypt before they are saved.
      </p>
    </div>
  );
}
