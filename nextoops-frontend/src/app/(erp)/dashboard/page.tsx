'use client';

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from 'react';
import { UserType } from '@/services/auth.service';

import { IncidentStatusBadge, PriorityBadge, SlaBadge } from "@/components/entity-badges";
import { MyWorkspace } from "@/components/dashboard/MyWorkspace";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CalendarCog,
  CircleDollarSign,
  ClipboardList,
  Clock,
  FileText,
  GitPullRequest,
  KeyRound,
  Layers,
  Package,
  Server,
  ShieldAlert,
  ShoppingCart,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";

// Add safe UI formatting utilities inline to resolve build errors
function fmtMoney(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}
function relativeDue(timestamp?: number) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString();
}
function fmtDate(timestamp?: number) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString();
}

const CHART_COLORS = ["#2563eb", "#0d9488", "#d97706", "#059669", "#dc2626", "#7c3aed"];

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "warn" | "danger";
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={
            "flex size-9 shrink-0 items-center justify-center rounded-lg " +
            (tone === "danger"
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
              : tone === "warn"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                : "bg-primary/10 text-primary")
          }
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutiveOverview() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardService.getSummary,
  });

  const router = useRouter();

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const s = summary;

  const statusData = Object.entries(s.assets.byStatus).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));
  const categoryData = Object.entries(s.assets.byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 6);

  const openWork = s.incidents.open + s.maintenance.dueSoon;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live KPIs across inventory, incidents, stock, maintenance and vendors.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Updates in real time · {new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={Server}
          label="Total assets"
          value={s.assets.total}
          sub={`${s.assets.assigned} assigned · ${s.assets.inStock} in stock`}
        />
        <Kpi
          icon={AlertTriangle}
          label="Open incidents"
          value={s.incidents.open}
          sub={`${s.incidents.critical} critical · avg fix ${s.incidents.avgResolutionHours}h`}
          tone={s.incidents.critical > 0 ? "danger" : "default"}
        />
        <Kpi
          icon={Boxes}
          label="Low stock"
          value={s.stock.lowStock}
          sub={`${s.stock.totalItems} SKUs · ${fmtMoney(s.stock.stockValue)} on hand`}
          tone={s.stock.lowStock > 0 ? "warn" : "default"}
        />
        <Kpi
          icon={CalendarCog}
          label="Maintenance due ≤7d"
          value={s.maintenance.dueSoon}
          sub={`${s.maintenance.upcoming.length} scheduled in next 30d`}
          tone={s.maintenance.dueSoon > 0 ? "warn" : "default"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={CircleDollarSign}
          label="Asset book value"
          value={fmtMoney(s.assets.totalValue)}
        />
        <Kpi
          icon={Clock}
          label="SLA compliance"
          value={s.incidents.sla.compliancePct != null ? `${s.incidents.sla.compliancePct}%` : "—"}
          sub={`${s.incidents.sla.breached} breached · ${s.incidents.sla.atRisk} at risk`}
          tone={s.incidents.sla.breached > 0 ? "danger" : s.incidents.sla.atRisk > 0 ? "warn" : "default"}
        />
        <Kpi
          icon={Server}
          label="Warranties expiring ≤30d"
          value={s.assets.expiringWarranties}
          tone={s.assets.expiringWarranties > 0 ? "warn" : "default"}
        />
        <Kpi
          icon={ClipboardList}
          label="Stock requests pending"
          value={s.stockRequests.pending}
          sub="Approval-gated issues"
          tone={s.stockRequests.pending > 0 ? "warn" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assets by status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {statusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No assets yet — add your first asset in Inventory.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assets by category (top 6)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {categoryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                  <XAxis type="number" allowDecimals={false} className="text-xs" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    className="text-xs capitalize"
                    tickLine={false}
                  />
                  <ReTooltip />
                  <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="shadow-none xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base">Incidents needing attention</CardTitle>
            <button
              onClick={() => router.push("/incidents")}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowUpRight className="size-3.5" />
            </button>
          </CardHeader>
          <CardContent>
            {s.incidents.attention.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing open — all clear.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.incidents.attention.map((i: any) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">
                        #{i.ticketNumber}
                      </TableCell>
                      <TableCell className="max-w-56 truncate font-medium">
                        {i.title}
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={i.priority} />
                      </TableCell>
                      <TableCell>
                        <SlaBadge state={i.sla ?? "none"} />
                      </TableCell>
                      <TableCell>
                        <IncidentStatusBadge status={i.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        {openWork > 0
          ? `${openWork} operational items currently need follow-up.`
          : "No operational items need follow-up right now."}{" "}
        Processes shown here support ISO-aligned IT service management practices; using this
        software does not by itself constitute certification.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  if (isAuthLoading || !user) return <div className="p-8">Loading...</div>;
  
  if (user.type !== UserType.SUPER_USER) {
    return <MyWorkspace />;
  }

  return <ExecutiveOverview />;
}
