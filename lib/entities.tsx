"use client";

/**
 * Per-entity configuration that drives the generic CRUD pages
 * (components/entity-crud.tsx). Each entry describes the endpoint, the form
 * fields, and how table columns are rendered.
 */

import type { ReactNode } from "react";
import {
  BadgeCheckIcon,
  CircleDollarSignIcon,
  ClipboardListIcon,
  LayoutListIcon,
  PackageIcon,
  ReceiptTextIcon,
} from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type {
  Category,
  Customer,
  Order,
  OrderItem,
  Payment,
  Product,
  Row,
} from "@/lib/types";

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "date";

/** Sources for dynamic <select> options, loaded from other endpoints. */
export type OptionSource = "categories" | "products" | "orders" | "customers";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Static choices (type: "select"). */
  options?: { label: string; value: string }[];
  /** Dynamic choices (type: "select") loaded from another entity. */
  optionsFrom?: OptionSource;
  /** Number step, e.g. "0.01" for prices. */
  step?: string;
}

export interface ColumnDef {
  key: string;
  header: string;
  render?: (row: Row) => ReactNode;
  className?: string;
}

export interface EntityConfig {
  /** Endpoint base path, e.g. "/products". */
  endpoint: string;
  /** Primary-key field name, e.g. "product_id". */
  idField: string;
  singularName: string;
  fields: FieldDef[];
  columns: ColumnDef[];
}

/* ---------------------------------------------------------------------------
 * Dynamic option lists
 * ------------------------------------------------------------------------ */

export async function loadOptions(
  source: OptionSource
): Promise<{ label: string; value: string }[]> {
  const { apiFetch } = await import("@/lib/api");
  switch (source) {
    case "categories": {
      const rows = await apiFetch<Category[]>("/category");
      return rows.map((c) => ({
        label: `${c.category_name} (${c.category_code})`,
        value: String(c.category_id),
      }));
    }
    case "products": {
      const rows = await apiFetch<Product[]>("/products");
      return rows.map((p) => ({
        label: `${p.product_name} — ${formatCurrency(p.price)}`,
        value: String(p.product_id),
      }));
    }
    case "orders": {
      const rows = await apiFetch<Order[]>("/order");
      return rows.map((o) => ({
        label: `Order #${o.order_id} — ${formatCurrency(o.total_amount)} (${o.status})`,
        value: String(o.order_id),
      }));
    }
    case "customers": {
      const rows = await apiFetch<Customer[]>("/customer");
      return rows.map((c) => ({
        label: `${c.customer_name} (${c.email})`,
        value: String(c.customer_id),
      }));
    }
  }
}

/* ---------------------------------------------------------------------------
 * Entity definitions
 * ------------------------------------------------------------------------ */

export const productEntity: EntityConfig = {
  endpoint: "/products",
  idField: "product_id",
  singularName: "Product",
  fields: [
    {
      name: "product_name",
      label: "Product name",
      type: "text",
      required: true,
      placeholder: "e.g. Premium Arabica Coffee 500g",
    },
    {
      name: "price",
      label: "Price (₱)",
      type: "number",
      required: true,
      step: "0.01",
      placeholder: "0.00",
    },
    {
      name: "category_id",
      label: "Category",
      type: "select",
      optionsFrom: "categories",
      hint: "Optional — groups this product under a category.",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Short description shown to buyers…",
    },
  ],
  columns: [
    {
      key: "product_id",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.product_id)}
        </span>
      ),
    },
    {
      key: "product_name",
      header: "Product",
      render: (row) => (
        <div className="font-medium">{String(row.product_name ?? "—")}</div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="line-clamp-1 max-w-72 text-muted-foreground">
          {row.description ? String(row.description) : "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (row) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(row.price as number)}
        </span>
      ),
    },
    {
      key: "category_id",
      header: "Category",
      render: (row) =>
        row.category_id ? (
          <BadgeCheckIcon className="size-4 text-muted-foreground" />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      className: "text-center",
    },
  ],
};

export const categoryEntity: EntityConfig = {
  endpoint: "/category",
  idField: "category_id",
  singularName: "Category",
  fields: [
    {
      name: "category_code",
      label: "Category code",
      type: "text",
      required: true,
      placeholder: "e.g. BVG",
      hint: "Short unique code (2–8 characters).",
    },
    {
      name: "category_name",
      label: "Category name",
      type: "text",
      required: true,
      placeholder: "e.g. Beverages",
    },
    {
      name: "id",
      label: "Reference ID",
      type: "number",
      required: true,
      placeholder: "e.g. 1",
      hint: "Legacy reference number stored by the backend.",
    },
  ],
  columns: [
    {
      key: "category_id",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.category_id)}
        </span>
      ),
    },
    {
      key: "category_code",
      header: "Code",
      render: (row) => (
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-medium">
          {String(row.category_code ?? "—")}
        </span>
      ),
    },
    {
      key: "category_name",
      header: "Name",
      render: (row) => <div className="font-medium">{String(row.category_name ?? "—")}</div>,
    },
    { key: "id", header: "Reference" },
  ],
};

export const orderEntity: EntityConfig = {
  endpoint: "/order",
  idField: "order_id",
  singularName: "Order",
  fields: [
    {
      name: "user_id",
      label: "User ID",
      type: "number",
      required: true,
      placeholder: "e.g. 1",
      hint: "ID of the user who placed the order.",
    },
    {
      name: "total_amount",
      label: "Total amount (₱)",
      type: "number",
      required: true,
      step: "0.01",
      placeholder: "0.00",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Shipped", value: "shipped" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
  ],
  columns: [
    {
      key: "order_id",
      header: "Order",
      render: (row) => (
        <span className="font-medium">#{String(row.order_id)}</span>
      ),
    },
    { key: "user_id", header: "User" },
    {
      key: "total_amount",
      header: "Total",
      render: (row) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(row.total_amount as number)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge value={String(row.status ?? "")} />,
    },
    {
      key: "created_at",
      header: "Placed",
      render: (row) => (
        <span className="text-muted-foreground">
          {formatDate(row.created_at as string | undefined)}
        </span>
      ),
    },
  ],
};

export const orderItemEntity: EntityConfig = {
  endpoint: "/order-items",
  idField: "order_item_id",
  singularName: "Order item",
  fields: [
    {
      name: "order_id",
      label: "Order",
      type: "select",
      optionsFrom: "orders",
      required: true,
    },
    {
      name: "product_id",
      label: "Product",
      type: "select",
      optionsFrom: "products",
      required: true,
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      required: true,
      placeholder: "1",
    },
    {
      name: "price",
      label: "Unit price (₱)",
      type: "number",
      required: true,
      step: "0.01",
      placeholder: "0.00",
    },
  ],
  columns: [
    {
      key: "order_item_id",
      header: "Item",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.order_item_id)}
        </span>
      ),
    },
    {
      key: "order_id",
      header: "Order",
      render: (row) => {
        const order = row as unknown as OrderItem;
        return <span className="font-medium">#{String(order.order_id)}</span>;
      },
    },
    {
      key: "product_id",
      header: "Product",
      render: (row) => {
        const item = row as unknown as OrderItem;
        return (
          <span className="inline-flex items-center gap-1.5">
            <PackageIcon className="size-3.5 text-muted-foreground" />
            #{String(item.product_id)}
          </span>
        );
      },
    },
    {
      key: "quantity",
      header: "Qty",
      render: (row) => (
        <span className="tabular-nums">{formatNumber(row.quantity as number)}</span>
      ),
    },
    {
      key: "price",
      header: "Unit price",
      render: (row) => (
        <span className="tabular-nums">{formatCurrency(row.price as number)}</span>
      ),
    },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (row) => {
        const item = row as unknown as OrderItem;
        return (
          <span className="font-medium tabular-nums">
            {formatCurrency(Number(item.price) * Number(item.quantity))}
          </span>
        );
      },
    },
  ],
};

export const customerEntity: EntityConfig = {
  endpoint: "/customer",
  idField: "customer_id",
  singularName: "Customer",
  fields: [
    {
      name: "customer_name",
      label: "Full name",
      type: "text",
      required: true,
      placeholder: "e.g. Maria Santos",
    },
    {
      name: "email",
      label: "Email",
      type: "text",
      required: true,
      placeholder: "maria@example.com",
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      required: true,
      placeholder: "+63 917 555 0101",
    },
  ],
  columns: [
    {
      key: "customer_id",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.customer_id)}
        </span>
      ),
    },
    {
      key: "customer_name",
      header: "Customer",
      render: (row) => (
        <div className="font-medium">{String(row.customer_name ?? "—")}</div>
      ),
    },
    { key: "email", header: "Email" },
    {
      key: "phone",
      header: "Phone",
      render: (row) => (
        <span className="text-muted-foreground">{String(row.phone ?? "—")}</span>
      ),
    },
  ],
};

export const addressEntity: EntityConfig = {
  endpoint: "/address",
  idField: "address_id",
  singularName: "Address",
  fields: [
    {
      name: "customer_id",
      label: "Customer",
      type: "select",
      optionsFrom: "customers",
      required: true,
    },
    { name: "street", label: "Street", type: "text", required: true },
    { name: "city", label: "City", type: "text", required: true },
    { name: "province", label: "Province", type: "text", required: true },
    {
      name: "postal_code",
      label: "Postal code",
      type: "text",
      required: true,
      placeholder: "e.g. 1100",
    },
  ],
  columns: [
    {
      key: "address_id",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.address_id)}
        </span>
      ),
    },
    {
      key: "customer_id",
      header: "Customer",
      render: (row) => (
        <span className="font-medium">#{String(row.customer_id)}</span>
      ),
    },
    {
      key: "street",
      header: "Street",
      render: (row) => (
        <span className="line-clamp-1 max-w-64">{String(row.street ?? "—")}</span>
      ),
    },
    { key: "city", header: "City" },
    { key: "province", header: "Province" },
    {
      key: "postal_code",
      header: "Postal code",
      render: (row) => (
        <span className="font-mono text-xs">{String(row.postal_code ?? "—")}</span>
      ),
    },
  ],
};

export const deliveryEntity: EntityConfig = {
  endpoint: "/delivery",
  idField: "delivery_id",
  singularName: "Delivery",
  fields: [
    {
      name: "order_id",
      label: "Order",
      type: "select",
      optionsFrom: "orders",
      required: true,
    },
    {
      name: "delivery_address",
      label: "Delivery address",
      type: "textarea",
      required: true,
      placeholder: "House no., street, city, province, postal code",
    },
    {
      name: "delivery_date",
      label: "Delivery date",
      type: "date",
      hint: "Optional — expected delivery day.",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "In transit", value: "in transit" },
        { label: "Delivered", value: "delivered" },
        { label: "Failed", value: "failed" },
      ],
    },
  ],
  columns: [
    {
      key: "delivery_id",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.delivery_id)}
        </span>
      ),
    },
    {
      key: "order_id",
      header: "Order",
      render: (row) => (
        <span className="font-medium">#{String(row.order_id)}</span>
      ),
    },
    {
      key: "delivery_address",
      header: "Address",
      render: (row) => (
        <span className="line-clamp-1 max-w-80 text-muted-foreground">
          {String(row.delivery_address ?? "—")}
        </span>
      ),
    },
    {
      key: "delivery_date",
      header: "Date",
      render: (row) => (
        <span className="text-muted-foreground">
          {formatDate(row.delivery_date as string | null)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge value={String(row.status ?? "")} />,
    },
  ],
};

export const paymentEntity: EntityConfig = {
  endpoint: "/payment",
  idField: "payment_id",
  singularName: "Payment",
  fields: [
    {
      name: "order_id",
      label: "Order",
      type: "select",
      optionsFrom: "orders",
      required: true,
    },
    {
      name: "payment_method",
      label: "Method",
      type: "select",
      required: true,
      options: [
        { label: "Cash", value: "cash" },
        { label: "GCash", value: "gcash" },
        { label: "Bank transfer", value: "bank_transfer" },
        { label: "Credit card", value: "credit_card" },
      ],
    },
    {
      name: "amount",
      label: "Amount (₱)",
      type: "number",
      required: true,
      step: "0.01",
      placeholder: "0.00",
    },
    {
      name: "payment_status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Completed", value: "completed" },
        { label: "Failed", value: "failed" },
        { label: "Refunded", value: "refunded" },
      ],
    },
  ],
  columns: [
    {
      key: "payment_id",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.payment_id)}
        </span>
      ),
    },
    {
      key: "order_id",
      header: "Order",
      render: (row) => (
        <span className="font-medium">#{String(row.order_id)}</span>
      ),
    },
    {
      key: "payment_method",
      header: "Method",
      render: (row) => {
        const payment = row as unknown as Payment;
        const icon =
          payment.payment_method === "cash" ? (
            <CircleDollarSignIcon className="size-3.5" />
          ) : payment.payment_method === "credit_card" ? (
            <ReceiptTextIcon className="size-3.5" />
          ) : (
            <ClipboardListIcon className="size-3.5" />
          );
        return (
          <span className="inline-flex items-center gap-1.5">
            {icon}
            {String(payment.payment_method ?? "—").replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(row.amount as number)}
        </span>
      ),
    },
    {
      key: "payment_status",
      header: "Status",
      render: (row) => <StatusBadge value={String(row.payment_status ?? "")} />,
    },
  ],
};

export const userEntity: EntityConfig = {
  endpoint: "/users",
  idField: "id",
  singularName: "User",
  fields: [
    {
      name: "username",
      label: "Username",
      type: "text",
      required: true,
      placeholder: "e.g. jdoe",
    },
    {
      name: "password",
      label: "Password",
      type: "text",
      required: true,
      placeholder: "Minimum 6 characters",
      hint: "Hashed with bcrypt before it is stored.",
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      options: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
      ],
    },
  ],
  columns: [
    {
      key: "id",
      header: "ID",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.id)}
        </span>
      ),
    },
    {
      key: "username",
      header: "Username",
      render: (row) => (
        <div className="font-medium">{String(row.username ?? "—")}</div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
          <LayoutListIcon className="size-3" />
          {String(row.role ?? "user")}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      render: (row) => (
        <span className="text-muted-foreground">
          {formatDate(row.created_at as string | undefined)}
        </span>
      ),
    },
  ],
};
