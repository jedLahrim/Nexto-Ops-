'use client';

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Inbox, X } from "lucide-react";
import { usersService } from "@/services/users.service";

export function AccessRequestsCard() {
  const queryClient = useQueryClient();
  
  const { data: requests, isLoading } = useQuery({
    queryKey: ['signupRequests'],
    queryFn: usersService.getSignupRequests,
  });

  const rejectReq = useMutation({
    mutationFn: usersService.rejectSignup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['signupRequests'] })
  });
  
  const approveReq = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => usersService.approveSignup(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signupRequests'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const [approveFor, setApproveFor] = useState<any | null>(null);
  const [form, setForm] = useState({ username: "", pin: "", role: "user" });
  const [busy, setBusy] = useState(false);
  const [showDecided, setShowDecided] = useState(false);

  const pending = (requests ?? []).filter((r: any) => r.status === "pending");
  const decided = (requests ?? []).filter((r: any) => r.status !== "pending");

  const openApprove = (r: any) => {
    const local = r.email.split("@")[0]?.replace(/[^a-z0-9._-]/gi, "") ?? "";
    setForm({ username: local, pin: "", role: "user" });
    setApproveFor(r);
  };

  const doApprove = async () => {
    if (!approveFor) return;
    setBusy(true);
    try {
      await approveReq.mutateAsync({
        id: approveFor.id,
        payload: {
          username: form.username.trim(),
          pin: form.pin.trim(),
          role: form.role,
        }
      });
      toast.success(
        `Account created for ${approveFor.email} — username "${form.username.trim()}".`
      );
      setApproveFor(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval failed.");
    } finally {
      setBusy(false);
    }
  };

  const doReject = async (r: any) => {
    setBusy(true);
    try {
      await rejectReq.mutateAsync(r.id);
      toast.success("Request rejected.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not reject.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="size-4 text-muted-foreground" /> Access requests
          {pending.length > 0 && (
            <Badge className="bg-amber-500 text-amber-950">{pending.length} waiting</Badge>
          )}
        </CardTitle>
        {decided.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowDecided((v) => !v)}
          >
            {showDecided ? "Hide decided" : `Show decided (${decided.length})`}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : pending.length === 0 && decided.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No access requests yet. People can request access from the login screen —
            their email is verified with a code, then you approve the account.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((r: any) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {r.name ?? "—"}{" "}
                    <span className="truncate font-normal text-muted-foreground">
                      {r.email}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      email verified
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.department ? `${r.department} · ` : ""}requested {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" className="gap-1.5" onClick={() => openApprove(r)} disabled={busy}>
                    <Check className="size-3.5" /> Approve & provision
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => doReject(r)}
                    disabled={busy}
                  >
                    <X className="size-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
            {showDecided &&
              decided.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate">{r.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.status} by {r.decidedBy ?? "—"}
                      {r.decisionNote ? ` · ${r.decisionNote}` : ""}
                    </p>
                  </div>
                  <Badge variant={r.status === "approved" ? "secondary" : "outline"}>
                    {r.status}
                  </Badge>
                </div>
              ))}
          </div>
        )}
      </CardContent>

      <Dialog open={approveFor !== null} onOpenChange={(o) => !o && setApproveFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve access request</DialogTitle>
            <DialogDescription>
              This provisions the account immediately. Hand the username and 6-digit
              password to {approveFor?.email} — they can sign in right away (or with
              email code).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="appr-username">Username *</Label>
              <Input
                id="appr-username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. j.cooper"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appr-pin">6-digit password *</Label>
              <Input
                id="appr-pin"
                inputMode="numeric"
                maxLength={6}
                value={form.pin}
                onChange={(e) =>
                  setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })
                }
                placeholder="6 digits (not 123456 or 000000…)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Staff — permission-based</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">IT Admin (full control)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveFor(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              disabled={
                busy ||
                form.username.trim().length < 3 ||
                !/^\d{6}$/.test(form.pin.trim())
              }
              onClick={doApprove}
            >
              Approve & create account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
