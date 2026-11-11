"use client";

/**
 * Dashboard overview — KPI cards (products, orders, customers, revenue) plus
 * recent orders and a delivery/payments snapshot, all fetched from the
 * NestJS API with the signed-in user's JWT.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  Loader2Icon,
  PackageIcon,
  TriangleAlertIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Customer, Order, Payment, Product } from "@/lib/types";

interface Snapshot {
  products: Product[] | null;
  orders: Order[] | null;
  customers: Customer[] | null;
  payments: Payment[] | null;
}

const EMPTY_SNAPSHOT: Snapshot = {
  products: null,
  orders: null,
  customers: null,
  payments: null,
};

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  hrefLabel,
}: {
  label: string;
  value: string;
  icon: typeof PackageIcon;
  href: string;
  hrefLabel: string;
}) {
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="gap-1.5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </div>
        <CardTitle className="text-2xl font-bold tabular-nums sm:text-3xl">
          {value}
        </CardTitle>
      </CardHeader>
      <CardAction>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={href} />}>
          {hrefLabel}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </CardAction>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [products, orders, customers, payments] = await Promise.allSettled([
      apiFetch<Product[]>("/products"),
      apiFetch<Order[]>("/order"),
      apiFetch<Customer[]>("/customer"),
      apiFetch<Payment[]>("/payment"),
    ]);
    setSnapshot({
      products: products.status === "fulfilled" ? products.value : null,
      orders: orders.status === "fulfilled" ? orders.value : null,
      customers: customers.status === "fulfilled" ? customers.value : null,
      payments: payments.status === "fulfilled" ? payments.value : null,
    });
    const firstError = [products, orders, customers, payments].find(
      (result) => result.status === "rejected"
    );
    if (firstError) {
      const reason =
        firstError.status === "rejected" ? firstError.reason : null;
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load dashboard data from the API."
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const orders = snapshot.orders ?? [];
    const payments = snapshot.payments ?? [];

    const completedRevenue = payments
      .filter((p) => p.payment_status === "completed")
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

    const pendingOrders = orders.filter(
      (o) => o.status === "pending" || o.status === "processing"
    ).length;

    return {
      productCount: snapshot.products?.length ?? 0,
      orderCount: orders.length,
      customerCount: snapshot.customers?.length ?? 0,
      completedRevenue,
      pendingOrders,
    };
  }, [snapshot]);

  const recentOrders = useMemo(() => {
    const orders = [...(snapshot.orders ?? [])];
    orders.sort(
      (a, b) => Number(b.order_id ?? 0) - Number(a.order_id ?? 0)
    );
    return orders.slice(0, 5);
  }, [snapshot]);

  const paymentsByStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const payment of snapshot.payments ?? []) {
      const key = String(payment.payment_status ?? "unknown");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [snapshot]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Welcome back{user?.username ? `, ${user.username}` : ""}
        </h2>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your store today.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          <span className="flex-1">
            {error}{" "}
            <button
              type="button"
              onClick={() => void load()}
              className="font-medium underline underline-offset-2"
            >
              Retry
            </button>
          </span>
        </div>
      ) : null}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-31 w-full rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Products"
              value={String(stats.productCount)}
              icon={PackageIcon}
              href="/dashboard/products"
              hrefLabel="Manage"
            />
            <StatCard
              label="Orders"
              value={String(stats.orderCount)}
              icon={ArrowRightIcon}
              href="/dashboard/orders"
              hrefLabel="Manage"
            />
            <StatCard
              label="Customers"
              value={String(stats.customerCount)}
              icon={UsersIcon}
              href="/dashboard/customers"
              hrefLabel="Manage"
            />
            <StatCard
              label="Revenue (completed)"
              value={formatCurrency(stats.completedRevenue)}
              icon={WalletIcon}
              href="/dashboard/payments"
              hrefLabel="Manage"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="gap-4 py-5 lg:col-span-2">
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <CardDescription>
              The five most recent orders recorded in the system.
            </CardDescription>
          </CardHeader>
          {loading ? (
            <div className="px-6 pb-2">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="px-6 pb-2 text-sm text-muted-foreground">
              No orders yet —{" "}
              <Link
                href="/dashboard/orders"
                className="font-medium text-foreground underline underline-offset-2"
              >
                create the first one
              </Link>
              .
            </p>
          ) : (
            <div className="px-3 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="font-medium">
                        #{order.order_id}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={order.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Payments breakdown */}
        <Card className="gap-4 py-5">
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Payments</CardTitle>
            <CardDescription>Records grouped by status.</CardDescription>
          </CardHeader>
          {loading ? (
            <div className="px-6 pb-2">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : paymentsByStatus.length === 0 ? (
            <p className="px-6 pb-2 text-sm text-muted-foreground">
              No payment records yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2 px-6 pb-2">
              {paymentsByStatus.map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <StatusBadge value={status} />
                  <span className="font-medium tabular-nums">{count}</span>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                nativeButton={false}
                render={<Link href="/dashboard/payments" />}
              >
                View payments
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-3.5 animate-spin" />
          Loading dashboard data…
        </p>
      ) : null}
    </div>
  );
}
