'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const schema = z.object({ title: z.string().min(1), description: z.string().optional(), status: z.string().optional(), value: z.coerce.number().optional(), startDate: z.string().optional(), endDate: z.string().optional() });

function ContractFormDialog({ open, onOpenChange, initialData }: any) {
  const qc = useQueryClient();
  const isEditing = !!initialData;
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { title: '', description: '', status: 'draft', value: 0, startDate: '', endDate: '' } });

  const mutation = useMutation({
    mutationFn: async (data: any) => { if (isEditing) await api.patch(`/contracts/${initialData.id}`, data); else await api.post('/contracts', data); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); toast.success(`Contract ${isEditing ? 'updated' : 'created'}`); onOpenChange(false); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>{isEditing ? 'Edit' : 'New'} Contract</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="value" render={({ field }) => (<FormItem><FormLabel>Contract Value</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value as any} /></FormControl></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
            </div>
            {isEditing && <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="terminated">Terminated</SelectItem></SelectContent></Select></FormItem>)} />}
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

export default function ContractsPage() {
  const qc = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ['contracts'], queryFn: async () => (await api.get('/contracts')).data });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contracts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); toast.success('Contract deleted'); },
  });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Contracts</h1><p className="mt-1 text-sm text-muted-foreground">Manage vendor and service contracts</p></div>
        <Button onClick={() => { setEditing(null); setIsFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> New Contract</Button>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Vendor</TableHead><TableHead>Status</TableHead><TableHead>Value</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
             : !items?.length ? <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No contracts found.</TableCell></TableRow>
             : items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.vendor?.name || '—'}</TableCell>
                <TableCell><Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge></TableCell>
                <TableCell>${Number(item.value).toLocaleString()}</TableCell>
                <TableCell>{item.startDate ? format(new Date(item.startDate), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell>{item.endDate ? format(new Date(item.endDate), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setIsFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirm('Delete?') && deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ContractFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} initialData={editing} />
    </div>
  );
}
