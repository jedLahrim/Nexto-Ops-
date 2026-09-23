import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ASSET_CATEGORY_ICONS, titleCase } from "@/lib/ui";

const ASSET_STATUS_STYLES: Record<string, string> = {
  in_stock: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  assigned: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  under_repair: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  retired: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const INCIDENT_STATUS_STYLES: Record<string, string> = {
  new: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  assigned: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  closed: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  low: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  planning: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const MAINT_STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

const MOVEMENT_STYLES: Record<string, string> = {
  in: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  out: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  adjust: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  damage: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  return: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

const SLA_STYLES: Record<string, string> = {
  on_track: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  at_risk: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  breached: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  met: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  none: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const STOCK_REQUEST_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  fulfilled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  cancelled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function TintedBadge({ label, className }: { label: string; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("font-medium", className)}>
      {label}
    </Badge>
  );
}

export function AssetStatusBadge({ status }: { status: string }) {
  return <TintedBadge label={titleCase(status)} className={ASSET_STATUS_STYLES[status]} />;
}

export function IncidentStatusBadge({ status }: { status: string }) {
  return <TintedBadge label={titleCase(status)} className={INCIDENT_STATUS_STYLES[status]} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <TintedBadge label={titleCase(priority)} className={PRIORITY_STYLES[priority]} />;
}

export function MaintenanceStatusBadge({ status }: { status: string }) {
  return <TintedBadge label={titleCase(status)} className={MAINT_STATUS_STYLES[status]} />;
}

export function MovementBadge({ type }: { type: string }) {
  return <TintedBadge label={titleCase(type)} className={MOVEMENT_STYLES[type]} />;
}

export function SlaBadge({ state, label }: { state: string; label?: string }) {
  return (
    <TintedBadge
      label={label ?? titleCase(state.replace("_", " "))}
      className={SLA_STYLES[state] ?? SLA_STYLES.none}
    />
  );
}

export function StockRequestStatusBadge({ status }: { status: string }) {
  return <TintedBadge label={titleCase(status)} className={STOCK_REQUEST_STYLES[status]} />;
}

export function CategoryIconBadge({ category }: { category: string }) {
  const Icon = ASSET_CATEGORY_ICONS[category] ?? ASSET_CATEGORY_ICONS.other;
  return (
    <span className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground">
      <Icon className="size-3.5" />
    </span>
  );
}
