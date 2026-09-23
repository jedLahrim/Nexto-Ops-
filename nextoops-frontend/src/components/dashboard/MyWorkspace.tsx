'use client';

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CategoryIconBadge,
  IncidentStatusBadge,
  PriorityBadge,
} from "@/components/entity-badges";
import { QuickReportDialog } from "@/components/common/QuickReportDialog";
import { TicketThreadDialog } from "@/components/tickets/TicketThread";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CircleCheck,
  Laptop,
  MessageSquare,
  Package,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

const REQUEST_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  fulfilled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

export function MyWorkspace() {
  const queryClient = useQueryClient();

  const { data: ws, isLoading: isWsLoading } = useQuery({
    queryKey: ['workspace'],
    queryFn: () => api.get('/dashboard/workspace').then(res => res.data),
  });

  const verifyTicket = useMutation({
    mutationFn: (id: string) => api.post(`/incidents/${id}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
      toast.success("Thanks! Ticket closed.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Could not confirm.");
    }
  });

  const reopenTicket = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => 
      api.post(`/incidents/${id}/reopen`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
      toast.success("Ticket reopened — IT will take another look.");
      setReopenFor(null);
      setReopenReason("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Could not reopen.");
    }
  });

  const [reportOpen, setReportOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [reopenFor, setReopenFor] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  const tickets = ws?.myTickets ?? [];
  const openCount = tickets.filter(
    (t: any) => t.status !== "resolved" && t.status !== "closed"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IT Help Desk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Something broken or missing? Report it here — IT takes it from there.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setReportOpen(true)}
          className="gap-2 border-amber-500/60 bg-amber-500 text-amber-950 hover:bg-amber-400"
        >
          <TriangleAlert className="size-5" /> Report an issue
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-muted-foreground" /> My tickets
            {openCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {openCount} open
              </Badge>
            )}
          </CardTitle>
          <span className="text-xs text-muted-foreground">Click a ticket to read replies</span>
        </CardHeader>
        <CardContent>
          {isWsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No tickets yet. When you report an issue, it shows up here with IT's replies.
              </p>
              <Button
                variant="outline"
                className="mt-3 gap-2"
                onClick={() => setReportOpen(true)}
              >
                <TriangleAlert className="size-4" /> Report your first issue
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t: any) => (
                <div key={t.id} className="rounded-md border px-3 py-2.5">
                  <button
                    onClick={() => setThreadId(t.id)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        #{t.ticketNumber}
                      </span>
                      <span className="truncate text-sm font-medium">{t.title}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                      <PriorityBadge priority={t.priority} />
                      <IncidentStatusBadge status={t.status} />
                    </div>
                  </button>
                  {t.status === "resolved" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                      <p className="mr-auto text-xs text-muted-foreground">
                        IT marked this fixed — can you confirm it works now?
                      </p>
                      <Button
                        size="sm"
                        className="h-7 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700"
                        disabled={verifyTicket.isPending}
                        onClick={() => verifyTicket.mutate(t.id)}
                      >
                        <CircleCheck className="size-3.5" /> Yes, it's fixed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 text-xs"
                        disabled={verifyTicket.isPending}
                        onClick={() => {
                          setReopenFor(t.id);
                          setReopenReason("");
                        }}
                      >
                        <RotateCcw className="size-3.5" /> Still broken
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Laptop className="size-4 text-muted-foreground" /> My equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isWsLoading ? (
              <Skeleton className="h-20" />
            ) : ws?.myAssets?.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nothing is assigned to you right now.
              </p>
            ) : (
              <div className="space-y-2">
                {ws?.myAssets?.map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <CategoryIconBadge category={a.category} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{a.assetTag}</span>
                          {a.roomName ? ` · ${a.roomName}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {a.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4 text-muted-foreground" /> My requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isWsLoading ? (
              <Skeleton className="h-20" />
            ) : ws?.myRequests?.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No stock requests yet.
              </p>
            ) : (
              <div className="space-y-2">
                {ws?.myRequests?.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.itemName} × {r.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize " +
                        (REQUEST_BADGE[r.status] ?? REQUEST_BADGE.cancelled)
                      }
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <QuickReportDialog open={reportOpen} onOpenChange={setReportOpen} />
      <TicketThreadDialog incidentId={threadId} onOpenChange={(o) => !o && setThreadId(null)} />

      <Dialog open={reopenFor !== null} onOpenChange={(o) => !o && setReopenFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reopen the ticket</DialogTitle>
            <DialogDescription>
              Tell IT what is still wrong so they know where to pick up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reopen-why">What's still broken? *</Label>
            <Textarea
              id="reopen-why"
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. The projector turns on but the image flickers after a few minutes."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenFor(null)} disabled={reopenTicket.isPending}>
              Cancel
            </Button>
            <Button
              disabled={reopenTicket.isPending || reopenReason.trim().length < 3}
              onClick={() => reopenTicket.mutate({ id: reopenFor!, reason: reopenReason })}
            >
              Reopen ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
