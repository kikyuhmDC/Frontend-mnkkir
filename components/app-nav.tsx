"use client";

/** Sidebar navigation shared by the desktop rail and the mobile sheet. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardListIcon,
  FolderTreeIcon,
  HomeIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  MapPinIcon,
  PackageIcon,
  TruckIcon,
  UserCogIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon }],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", href: "/dashboard/products", icon: PackageIcon },
      { title: "Categories", href: "/dashboard/categories", icon: FolderTreeIcon },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "Orders", href: "/dashboard/orders", icon: ListOrderedIcon },
      { title: "Order items", href: "/dashboard/order-items", icon: ClipboardListIcon },
      { title: "Payments", href: "/dashboard/payments", icon: HomeIcon },
    ],
  },
  {
    label: "Fulfillment",
    items: [
      { title: "Deliveries", href: "/dashboard/deliveries", icon: TruckIcon },
      { title: "Customers", href: "/dashboard/customers", icon: UsersIcon },
      { title: "Addresses", href: "/dashboard/addresses", icon: MapPinIcon },
    ],
  },
  {
    label: "Administration",
    items: [{ title: "Users", href: "/dashboard/users", icon: UserCogIcon }],
  },
];

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <SidebarContent>
      {NAV_SECTIONS.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} onClick={onNavigate} />}
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}

/** Compact list used inside the mobile sheet. */
export function MobileNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="grid gap-4 p-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="grid gap-1">
          <p className="px-2 text-xs font-medium text-muted-foreground">
            {section.label}
          </p>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.title}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

/** Brand block shown at the top of the sidebar. */
export function NavBrand() {
  return (
    <SidebarHeader>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ListOrderedIcon className="size-4" />
        </span>
        <div className="grid leading-none">
          <span className="font-heading text-sm font-semibold">Orderly</span>
          <span className="text-[0.68rem] text-muted-foreground">
            Order management
          </span>
        </div>
      </div>
    </SidebarHeader>
  );
}

export function NavFooter() {
  return (
    <SidebarFooter>
      <p className="px-2 text-[0.68rem] text-muted-foreground">
        NestJS + Next.js demo
      </p>
    </SidebarFooter>
  );
}
