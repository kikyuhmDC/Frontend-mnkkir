"use client";

/**
 * App-wide client providers:
 * - next-themes for light/dark/system theming
 * - AuthProvider for the NestJS JWT session
 * - sonner Toaster for toast notifications
 */

import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </ThemeProvider>
  );
}
