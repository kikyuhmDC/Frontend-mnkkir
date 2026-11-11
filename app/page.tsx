import Link from "next/link";
import {
  ArrowRightIcon,
  BarChart3Icon,
  ClipboardListIcon,
  CreditCardIcon,
  FolderTreeIcon,
  ListOrderedIcon,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: PackageIcon,
    title: "Product catalog",
    description:
      "Maintain products, stock levels and prices, organized into categories.",
  },
  {
    icon: ListOrderedIcon,
    title: "Order tracking",
    description:
      "Create and track orders from placement through payment and delivery.",
  },
  {
    icon: UsersIcon,
    title: "Customer directory",
    description:
      "Keep customer records with addresses for faster checkout and fulfillment.",
  },
  {
    icon: TruckIcon,
    title: "Deliveries",
    description:
      "Assign and monitor delivery status for every order that ships out.",
  },
  {
    icon: CreditCardIcon,
    title: "Payments",
    description:
      "Record payment methods, amounts and statuses alongside each order.",
  },
  {
    icon: ShieldCheckIcon,
    title: "JWT authentication",
    description:
      "Secure sign-in with access & refresh tokens backed by the NestJS API.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ListOrderedIcon className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold">Orderly</span>
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex">
            NestJS + Next.js
          </Badge>
          <nav className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button nativeButton={false} render={<Link href="/register" />}>
              Get started
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <Badge
              variant="secondary"
              className="h-7 gap-1.5 px-3 text-xs font-medium"
            >
              <BarChart3Icon className="size-3.5" />
              Order & inventory management
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
              Every order, product and delivery —{" "}
              <span className="text-primary">in one orderly place</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty sm:text-lg sm:leading-8">
              Orderly is a full-stack e-commerce back-office built on a NestJS
              API and a Next.js + ShadCN UI frontend. Sign in to manage the
              catalog, process orders, track deliveries and record payments.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" nativeButton={false} render={<Link href="/login" />}>
                Sign in to dashboard
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/register" />}
              >
                Create an account
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Demo credentials: <code className="font-mono">admin</code> /{" "}
              <code className="font-mono">admin123</code>
            </p>
          </div>
        </section>

        {/* Feature grid */}
        <section className="border-t bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3 text-center">
              <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Everything the storefront needs backstage
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Nine fully managed entities wired straight into the REST API
                with create, edit, search and delete — guarded by JWT auth.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="gap-3 py-5">
                  <CardHeader className="gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="size-5" />
                    </span>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-6">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Entity strip */}
        <section className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-10 text-sm text-muted-foreground sm:px-6">
            {[
              { icon: PackageIcon, label: "Products" },
              { icon: FolderTreeIcon, label: "Categories" },
              { icon: ClipboardListIcon, label: "Order items" },
              { icon: MapPinIcon, label: "Addresses" },
              { icon: UsersIcon, label: "Customers" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2">
                <Icon className="size-4" />
                {label}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            &copy; 2026 Orderly — demo project for the
            NestJS Backend API course.
          </p>
          <p className="font-mono text-xs">
            Next.js 16 · ShadCN UI · NestJS · MySQL
          </p>
        </div>
      </footer>
    </div>
  );
}
