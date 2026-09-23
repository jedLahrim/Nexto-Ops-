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
import { format } from "date-fns";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const schema = z.object({ softwareName: z.string().min(1), licenseKey: z.string().optional(), status: z.string().optional(), seats: z.coerce.number().optional(), seatsUsed: z.coerce.number().optional(), annualCost: z.coerce.number().optional(), expiryDate: z.string().optional() });

function LicenseFormDialog({ open, onOpenChange, initialData }: any) {
  const qc = useQueryClient();
  const isEditing = !!initialData;
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { softwareName: '', licenseKey: '', status: 'active', seats: 1, seatsUsed: 0, annualCost: 0, expiryDate: '' } });

  const mutation = useMutation({
    mutationFn: async (data: any) => { if (isEditing) await api.patch(`/licenses/${initialData.id}`, data); else await api.post('/licenses', data); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['licenses'] }); toast.success(`License ${isEditing ? 'updated' : 'created'}`); onOpenChange(false); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>{isEditing ? 'Edit' : 'New'} License</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="softwareName" render={({ field }) => (<FormItem><FormLabel>Software Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="licenseKey" render={({ field }) => (<FormItem><FormLabel>License Key</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="seats" render={({ field }) => (<FormItem><FormLabel>Total Seats</FormLabel><FormControl><Input type="number" {...field} value={field.value as any} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="seatsUsed" render={({ field }) => (<FormItem><FormLabel>Used Seats</FormLabel><FormControl><Input type="number" {...field} value={field.value as any} /></FormControl></FormItem>)} />
            </div>
            <FormField control={form.control} name="annualCost" render={({ field }) => (<FormItem><FormLabel>Annual Cost</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value as any} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="expiryDate" render={({ field }) => (<FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
            {isEditing && <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="revoked">Revoked</SelectItem></SelectContent></Select></FormItem>)} />}
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

export default function LicensesPage() {
  const qc = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ['licenses'], queryFn: async () => (await api.get('/licenses')).data });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/licenses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['licenses'] }); toast.success('License deleted'); },
  });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Licenses</h1><p className="mt-1 text-sm text-muted-foreground">Track software licenses and compliance</p></div>
        <Button onClick={() => { setEditing(null); setIsFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> New License</Button>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Software</TableHead><TableHead>Status</TableHead><TableHead>Seats</TableHead><TableHead>Annual Cost</TableHead><TableHead>Expiry</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
             : !items?.length ? <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No licenses found.</TableCell></TableRow>
             : items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.softwareName}</TableCell>
                <TableCell><Badge variant={item.status === 'active' ? 'default' : 'destructive'}>{item.status}</Badge></TableCell>
                <TableCell>{item.seatsUsed}/{item.seats}</TableCell>
                <TableCell>${Number(item.annualCost).toLocaleString()}</TableCell>
                <TableCell>{item.expiryDate ? format(new Date(item.expiryDate), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setIsFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirm('Delete?') && deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <LicenseFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} initialData={editing} />
    </div>
  );
}
