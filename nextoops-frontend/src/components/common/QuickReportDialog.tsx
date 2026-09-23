'use client';

import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { value: "hardware", label: "Hardware (PC, projector…)" },
  { value: "software", label: "Software" },
  { value: "network", label: "Network / internet" },
  { value: "access", label: "Access / login" },
  { value: "other", label: "Something else" },
] as const;

export function QuickReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  // Replace Convex queries with React Query
  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/org/rooms').then(res => res.data),
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.get('/inventory/assets').then(res => res.data),
  });

  const createQuickReport = useMutation({
    mutationFn: (data: any) => api.post('/incidents/quick-report', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    }
  });

  const [form, setForm] = useState({
    roomId: "",
    assetId: "",
    category: "hardware",
    description: "",
    urgent: false,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createQuickReport.mutateAsync({
        roomId: form.roomId ? form.roomId : undefined,
        assetId: form.assetId ? form.assetId : undefined,
        category: form.category,
        description: form.description,
        urgent: form.urgent || undefined,
      });
      toast.success(`Reported — ticket #${result.ticketNumber} created.`);
      onOpenChange(false);
      setForm({ roomId: "", assetId: "", category: "hardware", description: "", urgent: false });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Report failed.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-amber-600" /> Report an issue
          </DialogTitle>
          <DialogDescription>
            Something broken or missing? File it here — it goes straight to the IT
            team's incident queue with the room attached.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Room / class</Label>
              <Select
                value={form.roomId || "none"}
                onValueChange={(v) => setForm({ ...form, roomId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {(rooms ?? []).map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Which asset? (optional)</Label>
            <Select
              value={form.assetId || "none"}
              onValueChange={(v) => setForm({ ...form, assetId: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional — pick the item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— not item-specific —</SelectItem>
                {(assets ?? []).map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.assetTag} · {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-desc">What's wrong? *</Label>
            <Textarea
              id="qr-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Projector won't turn on, no power light. Class 8B starts at 10am."
              required
              disabled={createQuickReport.isPending}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.urgent}
              onChange={(e) => setForm({ ...form, urgent: e.target.checked })}
              disabled={createQuickReport.isPending}
            />
            It's urgent (class blocked right now)
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createQuickReport.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createQuickReport.isPending}>
              {createQuickReport.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send to IT team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
