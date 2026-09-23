'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Plus, Pencil, Trash2, CalendarCog } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  status: z.string().optional(),
  scheduledDate: z.string().optional(),
});

function MaintenanceFormDialog({ open, onOpenChange, initialData }: any) {
  const qc = useQueryClient();
  const isEditing = !!initialData;
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { title: '', description: '', category: 'Server', status: 'scheduled', scheduledDate: '' } });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) await api.patch(`/maintenance/${initialData.id}`, data);
      else await api.post('/maintenance', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); toast.success(`Schedule ${isEditing ? 'updated' : 'created'}`); onOpenChange(false); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>{isEditing ? 'Edit' : 'New'} Maintenance Schedule</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Server">Server</SelectItem><SelectItem value="Network">Network</SelectItem><SelectItem value="HVAC">HVAC</SelectItem><SelectItem value="UPS">UPS</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="scheduledDate" render={({ field }) => (<FormItem><FormLabel>Scheduled Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            {isEditing && <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />}
            <div className="flex justify-end pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => (await api.get('/maintenance')).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/maintenance/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); toast.success('Deleted'); },
  });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Schedules and service records</p>
        </div>
        <Button onClick={() => { setEditing(null); setIsFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> New Schedule</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead><TableHead>Assigned To</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : !items?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No maintenance schedules found.</TableCell></TableRow>
            ) : items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell><Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>{item.status}</Badge></TableCell>
                <TableCell>{item.scheduledDate ? format(new Date(item.scheduledDate), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell>{item.assignedTo?.fullName || '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setIsFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirm('Delete?') && deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <MaintenanceFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} initialData={editing} />
    </div>
  );
}
