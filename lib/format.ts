/** Display formatters shared across the dashboard. */

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("en-PH").format(
    Number.isFinite(num) ? num : 0
  );
}
