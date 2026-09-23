'use client';

import { useState } from "react";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { QuickReportDialog } from "@/components/common/QuickReportDialog";
import { orgService } from "@/services/org.service";
import { useAuth } from "@/hooks/use-auth";
import { UserType } from "@/services/auth.service";
import {
  Building2,
  DoorOpen,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

type DeptForm = {
  name: string;
  code: string;
  headOfDepartment: string;
  notes: string;
};

type RoomForm = {
  name: string;
  roomType: string;
  building: string;
  departmentId: string;
  capacity: string;
  notes: string;
};

const EMPTY_DEPT: DeptForm = { name: "", code: "", headOfDepartment: "", notes: "" };
const EMPTY_ROOM: RoomForm = {
  name: "",
  roomType: "classroom",
  building: "",
  departmentId: "",
  capacity: "",
  notes: "",
};

const ROOM_TYPES = [
  "classroom",
  "office",
  "meeting_room",
  "store",
  "lab",
  "other",
];

// Helper functions inline
function titleCase(str: string) {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmtMoney(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default function OrgPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.type === UserType.SUPER_USER;

  const { data: departments, isLoading: isDeptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: orgService.getDepartments,
  });

  const { data: rooms, isLoading: isRoomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: orgService.getRooms,
  });

  const { data: summary } = useQuery({
    queryKey: ['orgSummary'],
    queryFn: orgService.getSummary,
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => [], // mock for now until inventory is ready
  });

  const createDepartment = useMutation({
    mutationFn: orgService.createDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] })
  });

  const updateDepartment = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => orgService.updateDepartment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] })
  });

  const deleteDepartment = useMutation({
    mutationFn: orgService.deleteDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] })
  });

  const createRoom = useMutation({
    mutationFn: orgService.createRoom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] })
  });

  const updateRoom = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => orgService.updateRoom(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] })
  });

  const deleteRoom = useMutation({
    mutationFn: orgService.deleteRoom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] })
  });

  const [deptDialog, setDeptDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState<DeptForm>(EMPTY_DEPT);
  
  const [roomDialog, setRoomDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [roomForm, setRoomForm] = useState<RoomForm>(EMPTY_ROOM);
  
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [viewRoom, setViewRoom] = useState<any>(null);

  const openDeptCreate = () => {
    setEditingDept(null);
    setDeptForm(EMPTY_DEPT);
    setDeptDialog(true);
  };

  const openDeptEdit = (d: any) => {
    setEditingDept(d);
    setDeptForm({
      name: d.name,
      code: d.code,
      headOfDepartment: d.headOfDepartment ?? "",
      notes: d.notes ?? "",
    });
    setDeptDialog(true);
  };

  const submitDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editingDept) {
        await updateDepartment.mutateAsync({
          id: editingDept.id,
          data: deptForm
        });
        toast.success("Department updated.");
      } else {
        await createDepartment.mutateAsync(deptForm);
        toast.success("Department created.");
      }
      setDeptDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally {
      setBusy(false);
    }
  };

  const doDeleteDept = async (d: any) => {
    try {
      await deleteDepartment.mutateAsync(d.id);
      toast.success("Department deleted.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    }
  };

  const openRoomCreate = () => {
    setEditingRoom(null);
    setRoomForm(EMPTY_ROOM);
    setRoomDialog(true);
  };

  const openRoomEdit = (r: any) => {
    setEditingRoom(r);
    setRoomForm({
      name: r.name,
      roomType: r.roomType,
      building: r.building ?? "",
      departmentId: r.departmentId ?? "",
      capacity: r.capacity?.toString() ?? "",
      notes: r.notes ?? "",
    });
    setRoomDialog(true);
  };

  const submitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: roomForm.name,
        roomType: roomForm.roomType,
        building: roomForm.building || undefined,
        departmentId: roomForm.departmentId || undefined,
        capacity: roomForm.capacity ? Number(roomForm.capacity) : undefined,
        notes: roomForm.notes || undefined,
      };
      if (editingRoom) {
        await updateRoom.mutateAsync({ id: editingRoom.id, data: payload });
        toast.success("Room updated.");
      } else {
        await createRoom.mutateAsync(payload);
        toast.success("Room created.");
      }
      setRoomDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally {
      setBusy(false);
    }
  };

  const doDeleteRoom = async (r: any) => {
    try {
      await deleteRoom.mutateAsync(r.id);
      toast.success("Room deleted.");
      if (viewRoom?.id === r.id) setViewRoom(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    }
  };

  const deptName = (id?: string | null) =>
    (departments ?? []).find((d: any) => d.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments &amp; rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            School structure: which department owns what, and where every PC and projector lives.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 border-amber-500/50 text-amber-700 hover:bg-amber-50 dark:text-amber-400"
            onClick={() => setReportOpen(true)}
          >
            <TriangleAlert className="size-4" /> Report an issue
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={openRoomCreate} className="gap-2">
                <DoorOpen className="size-4" /> New room
              </Button>
              <Button onClick={openDeptCreate} className="gap-2">
                <Plus className="size-4" /> New department
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(summary ?? []).map((s: any) => (
          <Card key={s.department.id} className="p-5 shadow-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <p className="font-semibold">{s.department.name}</p>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {s.department.code}
                  </span>
                </div>
                {s.department.headOfDepartment && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    HoD: {s.department.headOfDepartment}
                  </p>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => openDeptEdit(s.department)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => doDeleteDept(s.department)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border px-2 py-1.5">
                <p className="text-lg font-semibold tabular-nums">{s.assetCount}</p>
                <p className="text-[11px] text-muted-foreground">assets</p>
              </div>
              <div className="rounded-md border px-2 py-1.5">
                <p className="text-lg font-semibold tabular-nums">{s.rooms?.length || 0}</p>
                <p className="text-[11px] text-muted-foreground">rooms</p>
              </div>
              <div className="rounded-md border px-2 py-1.5">
                <p className="text-lg font-semibold tabular-nums">
                  {fmtMoney(s.totalValue || 0)}
                </p>
                <p className="text-[11px] text-muted-foreground">value</p>
              </div>
            </div>
          </Card>
        ))}
        {summary !== undefined && summary.length === 0 && (
          <Card className="col-span-full p-8 text-center shadow-none">
            <p className="font-medium">No departments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first department (e.g. Mathematics, Science, IT), then add
              rooms and place assets in them.
            </p>
          </Card>
        )}
      </div>

      {/* Rooms table */}
      <Card className="overflow-hidden shadow-none">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">
            Rooms {(rooms ?? []).length > 0 && `(${(rooms ?? []).length})`}
          </p>
        </div>
        {isRoomsLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : rooms?.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No rooms yet — add classrooms, computer labs, science labs, the library…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms?.map((r: any) => {
                  const count = (assets ?? []).filter(
                    (a: any) => a.roomId === r.id && a.status !== "retired",
                  ).length;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-sm">{titleCase(r.roomType)}</TableCell>
                      <TableCell className="text-sm">{r.building ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {r.departmentId ? deptName(r.departmentId) : "—"}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {r.capacity ?? "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20"
                          onClick={() => setViewRoom(r)}
                        >
                          {count} asset{count === 1 ? "" : "s"}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openRoomEdit(r)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => doDeleteRoom(r)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={deptDialog} onOpenChange={setDeptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDept ? `Edit ${editingDept.name}` : "New department"}
            </DialogTitle>
            <DialogDescription>
              Departments group rooms and assets — Mathematics, Science, IT, Sports…
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitDept} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deptName">Name *</Label>
                <Input
                  id="deptName"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="Science"
                  required
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deptCode">Code *</Label>
                <Input
                  id="deptCode"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  placeholder="SCI"
                  maxLength={8}
                  required
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deptHod">Head of department</Label>
              <Input
                id="deptHod"
                value={deptForm.headOfDepartment}
                onChange={(e) =>
                  setDeptForm({ ...deptForm, headOfDepartment: e.target.value })
                }
                placeholder="Dr. A. Mutale"
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deptNotes">Notes</Label>
              <Textarea
                id="deptNotes"
                rows={2}
                value={deptForm.notes}
                onChange={(e) => setDeptForm({ ...deptForm, notes: e.target.value })}
                disabled={busy}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeptDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingDept ? "Save changes" : "Create department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoom ? `Edit ${editingRoom.name}` : "New room"}</DialogTitle>
            <DialogDescription>
              Rooms are where assets physically live.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRoom} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="roomName">Name *</Label>
                <Input
                  id="roomName"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="Computer Lab 1"
                  required
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select
                  value={roomForm.roomType}
                  onValueChange={(v) => setRoomForm({ ...roomForm, roomType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {titleCase(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="roomBuilding">Building / block</Label>
                <Input
                  id="roomBuilding"
                  value={roomForm.building}
                  onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                  placeholder="Block B"
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roomCapacity">Capacity (seats)</Label>
                <Input
                  id="roomCapacity"
                  type="number"
                  min="0"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={roomForm.departmentId || "none"}
                onValueChange={(v) =>
                  setRoomForm({ ...roomForm, departmentId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {(departments ?? []).map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roomNotes">Notes</Label>
              <Textarea
                id="roomNotes"
                rows={2}
                value={roomForm.notes}
                onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                disabled={busy}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoomDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingRoom ? "Save changes" : "Create room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <QuickReportDialog open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
