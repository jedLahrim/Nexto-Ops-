'use client';

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AccessRequestsCard } from "@/components/dashboard/AccessRequestsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { UserType } from "@/services/auth.service";
import { usersService } from "@/services/users.service";
import {
  Info,
  KeyRound,
  Loader2,
  Pencil,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserPlus,
  UserX,
  Lock,
} from "lucide-react";

const ROLES = [
  {
    value: "admin",
    label: "IT Admin",
    desc: "Full control: every module, all users, permissions",
  },
  {
    value: "user",
    label: "Staff",
    desc: "Uses exactly the modules granted under Permissions",
  },
  {
    value: "member",
    label: "Member",
    desc: "Uses exactly the modules granted under Permissions",
  },
] as const;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.type === UserType.SUPER_USER;
  const myId = user?.id;

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getUsers,
  });

  const { data: customSets } = useQuery({
    queryKey: ['permissionSets'],
    queryFn: usersService.getPermissionSets,
    enabled: isAdmin,
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string, role: string }) => usersService.setRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const createUser = useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const resetPin = useMutation({
    mutationFn: ({ id, pin }: { id: string, pin: string }) => usersService.resetPin(id, pin)
  });

  const updateUsername = useMutation({
    mutationFn: ({ id, username }: { id: string, username: string }) => usersService.updateUsername(id, username),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const updateProfile = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => usersService.updateProfile(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: string, active: boolean }) => usersService.setActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const setPermissions = useMutation({
    mutationFn: ({ id, modules }: { id: string, modules: string[] }) => usersService.setPermissions(id, modules),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const assignRole = useMutation({
    mutationFn: ({ id, roleId }: { id: string, roleId: string }) => usersService.assignRole(id, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const clearRole = useMutation({
    mutationFn: (id: string) => usersService.clearRole(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const [busyId, setBusyId] = useState<string | null>(null);

  const [permTarget, setPermTarget] = useState<any | null>(null);
  const [permDraft, setPermDraft] = useState<Set<string>>(new Set());
  const [permBusy, setPermBusy] = useState(false);

  const doAssignRole = async (u: any, roleId: string) => {
    setBusyId(u.id);
    try {
      await assignRole.mutateAsync({ id: u.id, roleId });
      toast.success("Role assigned.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign the role.");
    } finally {
      setBusyId(null);
    }
  };

  const doClearRole = async (u: any) => {
    setBusyId(u.id);
    try {
      await clearRole.mutateAsync(u.id);
      toast.success("Role detached.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to detach the role.");
    } finally {
      setBusyId(null);
    }
  };

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ username: "", name: "", email: "" });
  const [editBusy, setEditBusy] = useState(false);

  const openEdit = (u: any) => {
    setEditTarget(u);
    setEditForm({
      username: u.email && !u.email.includes("@") ? u.email : "",
      name: u.name ?? "",
      email: u.email && u.email.includes("@") ? u.email : "",
    });
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ username: "", name: "", email: "", pin: "", role: "user" });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ username: string; pin: string } | null>(null);

  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [resetPinValue, setResetPinValue] = useState("");
  const [resetting, setResetting] = useState(false);

  const rows = users ?? [];

  const openPermissions = (u: any) => {
    setPermTarget(u);
    setPermDraft(new Set([]));
  };

  const applyPresetToDraft = (setId: string) => {
    const custom = (customSets ?? []).find((s: any) => s.id === setId);
    if (custom) setPermDraft(new Set(custom.modules));
  };

  const savePermissions = async () => {
    if (!permTarget) return;
    setPermBusy(true);
    try {
      await setPermissions.mutateAsync({ id: permTarget.id, modules: Array.from(permDraft) });
      toast.success("Permissions saved.");
      setPermTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save permissions.");
    } finally {
      setPermBusy(false);
    }
  };

  const changeRole = async (u: any, role: string) => {
    setBusyId(u.id);
    try {
      await setRole.mutateAsync({ id: u.id, role });
      toast.success("Role updated.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update role.");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await createUser.mutateAsync({
        username: form.username,
        email: form.email || undefined,
        name: form.name,
        pin: form.pin,
        role: form.role,
      });
      toast.success(`Account created for ${result.username}.`);
      setCreated({ username: result.username, pin: form.pin });
      setForm({ username: "", name: "", email: "", pin: "", role: "user" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    try {
      await resetPin.mutateAsync({ id: resetTarget.id, pin: resetPinValue });
      toast.success(`PIN reset for ${resetTarget.email ?? "user"}.`);
      setResetTarget(null);
      setResetPinValue("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset PIN.");
    } finally {
      setResetting(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditBusy(true);
    try {
      if (editForm.username.trim() && editForm.username.trim().toLowerCase() !== editTarget.email?.toLowerCase()) {
        await updateUsername.mutateAsync({ id: editTarget.id, username: editForm.username });
      }
      await updateProfile.mutateAsync({
        id: editTarget.id,
        data: {
          name: editForm.name,
          email: editForm.email || undefined,
        }
      });
      toast.success("User updated.");
      setEditTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user.");
    } finally {
      setEditBusy(false);
    }
  };

  const handleSetActive = async (u: any, active: boolean) => {
    setBusyId(u.id);
    try {
      await setActive.mutateAsync({ id: u.id, active });
      toast.success(active ? "User reactivated." : "User deactivated.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally {
      setBusyId(null);
    }
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreated(null);
  };

  const roleBadge = (role?: string) =>
    role === "admin" ? (
      <Badge className="bg-primary gap-1">
        <ShieldCheck className="size-3" /> IT Admin
      </Badge>
    ) : role === "user" ? (
      <Badge variant="secondary">Staff</Badge>
    ) : role === "member" ? (
      <Badge variant="outline">Member</Badge>
    ) : (
      <Badge variant="outline">—</Badge>
    );

  if (isAuthLoading) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users &amp; access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign roles, customize individual users, reset PINs. Every change is audit-logged.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <UserPlus className="size-4" /> New local user
          </Button>
        )}
      </div>

      {isAdmin && <AccessRequestsCard />}

      <Card className="flex items-start gap-2 border-primary/30 bg-primary/5 p-3 text-sm shadow-none">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          <strong className="text-foreground">How access works:</strong> the
          <strong> IT Admin</strong> role has full control. Everyone else uses exactly the
          modules you grant with <strong>Permissions</strong>.
        </p>
      </Card>

      <Card className="overflow-hidden shadow-none">
        {isUsersLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username / email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Role</TableHead>
                  {isAdmin && <TableHead className="text-right">Manage</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">
                        {u.name ?? "—"}
                        {u.roleId && (
                          <Badge
                            variant="secondary"
                            className="ml-2 font-normal"
                          >
                            {(customSets ?? []).find((s: any) => s.id === u.roleId)?.name ?? "Role"}
                          </Badge>
                        )}
                        {u.active === false && (
                          <Badge variant="destructive" className="ml-2">Deactivated</Badge>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{roleBadge(u.role)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== "admin" && (
                            <Select
                              value={u.roleId ?? "custom"}
                              onValueChange={(v) =>
                                v === "custom" ? doClearRole(u) : doAssignRole(u, v)
                              }
                              disabled={busyId === u.id}
                            >
                              <SelectTrigger
                                className="h-8 w-40"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(customSets ?? []).map((s: any) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">
                                  Custom (no role)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {u.role !== "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5"
                              onClick={() => openPermissions(u)}
                            >
                              <Lock className="size-3.5" /> Permissions
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => openEdit(u)}
                          >
                            <Pencil className="size-3.5" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => {
                              setResetTarget(u);
                              setResetPinValue("");
                            }}
                          >
                            <KeyRound className="size-3.5" /> Reset PIN
                          </Button>
                          {u.id !== myId && (
                            <Button
                              variant={u.active === false ? "outline" : "ghost"}
                              size="sm"
                              className={"h-8 gap-1.5 " + (u.active === false ? "" : "text-destructive")}
                              onClick={() => handleSetActive(u, u.active === false)}
                              disabled={busyId === u.id}
                            >
                              {u.active === false ? (
                                <>
                                  <UserCheck className="size-3.5" /> Activate
                                </>
                              ) : (
                                <>
                                  <UserX className="size-3.5" /> Deactivate
                                </>
                              )}
                            </Button>
                          )}
                          <Select
                            value={u.role ?? "none"}
                            onValueChange={(v) => changeRole(u, v === "none" ? "member" : v)}
                            disabled={busyId === u.id}
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">IT Admin — full control</SelectItem>
                              <SelectItem value="user">Staff — permission-based</SelectItem>
                              <SelectItem value="member">Member — permission-based</SelectItem>
                              {!u.role && <SelectItem value="none">— unset —</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={(o) => (o ? setCreateOpen(true) : closeCreate())}>
        <DialogContent className="sm:max-w-md">
          {created ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600" /> Account created
                </DialogTitle>
                <DialogDescription>
                  Share these credentials with the user now.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 rounded-md border bg-muted/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Username
                    </p>
                    <p className="font-mono text-sm font-semibold">{created.username}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      6-digit password
                    </p>
                    <p className="font-mono text-lg font-bold tracking-[0.3em]">{created.pin}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={closeCreate}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>New local user</DialogTitle>
                <DialogDescription>
                  Creates a named account that signs in with username + 6-digit password.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nu-username">Username *</Label>
                  <Input
                    id="nu-username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    disabled={creating}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nu-name">Display name *</Label>
                  <Input
                    id="nu-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={creating}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nu-email">Linked email (optional)</Label>
                  <Input
                    id="nu-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nu-pin">6-digit password *</Label>
                  <Input
                    id="nu-pin"
                    value={form.pin}
                    onChange={(e) =>
                      setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })
                    }
                    inputMode="numeric"
                    className="font-mono tracking-[0.3em]"
                    required
                    disabled={creating}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role *</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v })}
                    disabled={creating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          <span className="font-medium">{r.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeCreate} disabled={creating}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Create account
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
