import type { LucideIcon } from "lucide-react";
import {
  Wrench,
  Server,
  Monitor,
  Printer,
  Projector,
  Laptop,
  Network,
  Smartphone,
  Mouse,
  Package,
} from "lucide-react";

/** Date helpers */
export function fmtDate(ts?: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(ts?: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtMoney(n?: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function daysUntil(ts?: number | null): number | null {
  if (!ts) return null;
  return Math.ceil((ts - Date.now()) / 86_400_000);
}

export function relativeDue(ts?: number | null): string {
  const d = daysUntil(ts);
  if (d == null) return "—";
  if (d < 0) return `${-d}d overdue`;
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  return `in ${d}d`;
}

/** Icon maps */
export const ASSET_CATEGORY_ICONS: Record<string, LucideIcon> = {
  laptop: Laptop,
  desktop: Monitor,
  monitor: Monitor,
  printer: Printer,
  projector: Projector,
  server: Server,
  network: Network,
  phone: Smartphone,
  peripheral: Mouse,
  other: Package,
};

export const STATUS_DOT: Record<string, string> = {
  in_stock: "bg-sky-500",
  assigned: "bg-emerald-500",
  under_repair: "bg-amber-500",
  retired: "bg-zinc-400",
};

export function titleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
