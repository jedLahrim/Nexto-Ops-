'use client';

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { MODULES } from "@/lib/permissions";
import { usersService } from "@/services/users.service";
import { Copy, Lock, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserType } from "@/services/auth.service";

type SetDraft = {
  id: string | null;
  name: string;
  description: string;
  modules: Set<string>;
};

const emptyDraft = (): SetDraft => ({
  id: null,
  name: "",
  description: "",
  modules: new Set<string>(),
});

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const { data: sets, isLoading: isSetsLoading } = useQuery({
    queryKey: ['permissionSets'],
    queryFn: usersService.getPermissionSets,
  });

  const createSet = useMutation({
    mutationFn: usersService.createPermissionSet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissionSets'] })
  });

  const updateSet = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => usersService.updatePermissionSet(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissionSets'] })
  });

  const removeSet = useMutation({
    mutationFn: usersService.deletePermissionSet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissionSets'] })
  });

  const seed = useMutation({
    mutationFn: usersService.seedPermissionSets,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissionSets'] })
  });

  const [draft, setDraft] = useState<SetDraft | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sets !== undefined && sets.length === 0) {
      seed.mutate();
    }
  }, [sets]);

  const labelOf = (key: string) =>
    MODULES.find((m) => m.key === key)?.label ?? key;

  const openCreate = (initial?: { name: string; description: string; modules: string[] }) => {
    setDraft({
      id: null,
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      modules: new Set<string>(initial?.modules ?? []),
    });
  };

  const openEdit = (s: any) => {
    setDraft({
      id: s.id,
      name: s.name,
      description: s.description ?? "",
      modules: new Set<string>(s.modules),
    });
  };

  const save = async () => {
    if (!draft) return;
    if (draft.name.trim().length < 2) {
      toast.error("Give the set a name (at least 2 characters).");
      return;
    }
    setBusy(true);
    try {
      const modules = Array.from(draft.modules);
      if (draft.id) {
        await updateSet.mutateAsync({ 
          id: draft.id, 
          data: { name: draft.name, description: draft.description || undefined, modules } 
        });
        toast.success("Permission set updated.");
      } else {
        await createSet.mutateAsync({ 
          name: draft.name, description: draft.description || undefined, modules 
        });
        toast.success("Permission set created — apply it from Users → Permissions.");
      }
      setDraft(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not save the set.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: any) => {
    if (!window.confirm(`Delete permission set "${s.name}"? Users keep their current access.`)) return;
    try {
      await removeSet.mutateAsync(s.id);
      toast.success("Permission set deleted.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not delete the set.");
    }
  };

  if (isAuthLoading) return null;
  if (user?.type !== UserType.SUPER_USER) return <div className="p-8">Access Denied. Admin only.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldCheck className="size-6 text-primary" /> Permission sets
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every set is fully yours to control — built-ins included. Create a new set
            empty and tick exactly what it should contain, or edit the built-ins in
            place.
          </p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2">
          <Plus className="size-4" /> New set
        </Button>
      </div>

      {isSetsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sets?.map((s: any) => (
            <Card key={s.id} className="shadow-none">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{s.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.description ?? "No description"}
                    </p>
                  </div>
                  <Badge variant={s.isBuiltIn ? "secondary" : "outline"}>
                    {s.isBuiltIn ? "Built-in" : "Custom"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.modules.length === 0 ? (
                    <span className="text-xs italic text-muted-foreground">
                      No modules selected
                    </span>
                  ) : (
                    <>
                      {s.modules.slice(0, 6).map((m: string) => (
                        <Badge key={m} variant="secondary" className="text-[10px] font-normal">
                          {labelOf(m)}
                        </Badge>
                      ))}
                      {s.modules.length > 6 && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          +{s.modules.length - 6} more
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(s)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      openCreate({
                        name: `${s.name} (copy)`,
                        description: s.description ?? "",
                        modules: s.modules,
                      })
                    }
                  >
                    <Copy className="size-3.5" /> Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => remove(s)}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-primary" />
              {draft?.id ? "Edit permission set" : "New permission set"}
            </DialogTitle>
            <DialogDescription>
              A set is exactly the modules you tick — nothing more. New sets start
              empty. Apply it to users from <strong>Users → Permissions</strong>.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="set-name">Name *</Label>
                  <Input
                    id="set-name"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Library keeper"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-desc">Description</Label>
                  <Input
                    id="set-desc"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Manages library stock and inventory"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Modules</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDraft({ ...draft, modules: new Set(MODULES.map((m) => m.key)) })}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDraft({ ...draft, modules: new Set() })}
                  >
                    Clear all
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {MODULES.map((m) => {
                  const checked = draft.modules.has(m.key);
                  return (
                    <label
                      key={m.key}
                      className={
                        "flex items-start gap-2 rounded-md border px-3 py-2 " +
                        (checked
                          ? "border-primary/40 bg-primary/5"
                          : " cursor-pointer hover:bg-muted/50")
                      }
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={checked}
                        disabled={busy}
                        onChange={(e) => {
                          const next = new Set(draft.modules);
                          if (e.target.checked) next.add(m.key);
                          else next.delete(m.key);
                          setDraft({ ...draft, modules: next });
                        }}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{m.label}</span>
                        <span className="block text-xs text-muted-foreground">{m.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {draft?.id ? "Save changes" : "Create set"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
