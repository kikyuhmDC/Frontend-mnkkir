"use client";

/**
 * Dashboard shell — sidebar navigation (desktop rail + mobile sheet) wrapped
 * in the AuthGuard so only signed-in users can see any of it.
 */

import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { AuthGuard } from "@/components/auth-guard";
import { NavBrand, NavFooter, NavList } from "@/components/app-nav";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <Sidebar collapsible="offcanvas">
          <NavBrand />
          <NavList />
          <NavFooter />
        </Sidebar>
        <SidebarInset className="min-h-svh">
          <AppHeader />
          <main className="flex-1 flex-col p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
