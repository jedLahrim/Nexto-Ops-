'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const schema = z.object({ name: z.string().min(1), category: z.string().min(1), allocatedAmount: z.coerce.number(), spentAmount: z.coerce.number().optional(), fiscalYear: z.string().optional(), status: z.string().optional() });

function BudgetFormDialog({ open, onOpenChange, initialData }: any) {
  const qc = useQueryClient();
  const isEditing = !!initialData;
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', category: 'Hardware', allocatedAmount: 0, spentAmount: 0, fiscalYear: new Date().getFullYear().toString(), status: 'planned' } });

  const mutation = useMutation({
    mutationFn: async (data: any) => { if (isEditing) await api.patch(`/budget/${initialData.id}`, data); else await api.post('/budget', data); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); toast.success(`Budget item ${isEditing ? 'updated' : 'created'}`); onOpenChange(false); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>{isEditing ? 'Edit' : 'New'} Budget Item</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Hardware">Hardware</SelectItem><SelectItem value="Software">Software</SelectItem><SelectItem value="Services">Services</SelectItem><SelectItem value="Training">Training</SelectItem><SelectItem value="Infrastructure">Infrastructure</SelectItem></SelectContent></Select></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="allocatedAmount" render={({ field }) => (<FormItem><FormLabel>Allocated</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value as any} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="spentAmount" render={({ field }) => (<FormItem><FormLabel>Spent</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value as any} /></FormControl></FormItem>)} />
            </div>
            <FormField control={form.control} name="fiscalYear" render={({ field }) => (<FormItem><FormLabel>Fiscal Year</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            {isEditing && <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="planned">Planned</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></FormItem>)} />}
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

export default function BudgetPage() {
  const qc = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ['budget'], queryFn: async () => (await api.get('/budget')).data });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budget/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); toast.success('Budget item deleted'); },
  });

  const totalAllocated = items?.reduce((sum: number, i: any) => sum + Number(i.allocatedAmount), 0) || 0;
  const totalSpent = items?.reduce((sum: number, i: any) => sum + Number(i.spentAmount), 0) || 0;

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Budget</h1><p className="mt-1 text-sm text-muted-foreground">IT budget tracking and allocation</p></div>
        <Button onClick={() => { setEditing(null); setIsFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> New Budget Item</Button>
      </div>
      {items?.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4"><p className="text-sm text-muted-foreground">Total Allocated</p><p className="text-2xl font-bold">${totalAllocated.toLocaleString()}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">Total Spent</p><p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">Remaining</p><p className="text-2xl font-bold">${(totalAllocated - totalSpent).toLocaleString()}</p></Card>
        </div>
      )}
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Allocated</TableHead><TableHead>Spent</TableHead><TableHead>Year</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
             : !items?.length ? <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No budget items found.</TableCell></TableRow>
             : items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>${Number(item.allocatedAmount).toLocaleString()}</TableCell>
                <TableCell>${Number(item.spentAmount).toLocaleString()}</TableCell>
                <TableCell>{item.fiscalYear}</TableCell>
                <TableCell><Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setIsFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirm('Delete?') && deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <BudgetFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} initialData={editing} />
    </div>
  );
}
