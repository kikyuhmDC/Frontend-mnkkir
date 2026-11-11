"use client";

/** Sticky dashboard header: sidebar trigger, page title, theme + user menu. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, LogOutIcon, UserIcon } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NAV_SECTIONS } from "@/components/app-nav";

function pageTitle(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.href === "/dashboard" && pathname === "/dashboard") {
        return item.title;
      }
      if (item.href !== "/dashboard" && pathname.startsWith(item.href)) {
        return item.title;
      }
    }
  }
  return "Dashboard";
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const initials = (user?.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-4" />
      <h1 className="text-sm font-semibold">{pageTitle(pathname)}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <span className="hidden text-xs text-muted-foreground sm:inline">
          {user?.username ? `@${user.username}` : "Signed in"}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Account menu"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserIcon className="size-4" />
                <span className="truncate">{user?.username ?? "Account"}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <div className="flex items-center gap-2 px-1.5 py-1 text-xs text-muted-foreground">
                Role
                <Badge variant="secondary" className="capitalize">
                  {user?.role ?? "—"}
                </Badge>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard" />}>
              <LayoutDashboardIcon /> Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
              <LogOutIcon /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
