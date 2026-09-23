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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const schema = z.object({ title: z.string().min(1), description: z.string().optional(), likelihood: z.string().min(1), impact: z.string().min(1), status: z.string().optional(), mitigationPlan: z.string().optional() });

function RiskFormDialog({ open, onOpenChange, initialData }: any) {
  const qc = useQueryClient();
  const isEditing = !!initialData;
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { title: '', description: '', likelihood: 'Medium', impact: 'Medium', status: 'open', mitigationPlan: '' } });

  const mutation = useMutation({
    mutationFn: async (data: any) => { if (isEditing) await api.patch(`/risks/${initialData.id}`, data); else await api.post('/risks', data); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks'] }); toast.success(`Risk ${isEditing ? 'updated' : 'created'}`); onOpenChange(false); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>{isEditing ? 'Edit' : 'New'} Risk</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="likelihood" render={({ field }) => (<FormItem><FormLabel>Likelihood</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select></FormItem>)} />
              <FormField control={form.control} name="impact" render={({ field }) => (<FormItem><FormLabel>Impact</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select></FormItem>)} />
            </div>
            <FormField control={form.control} name="mitigationPlan" render={({ field }) => (<FormItem><FormLabel>Mitigation Plan</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
            {isEditing && <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="mitigated">Mitigated</SelectItem><SelectItem value="accepted">Accepted</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></FormItem>)} />}
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

export default function RisksPage() {
  const qc = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ['risks'], queryFn: async () => (await api.get('/risks')).data });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/risks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks'] }); toast.success('Risk deleted'); },
  });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Risk Register</h1><p className="mt-1 text-sm text-muted-foreground">Identify and manage IT risks</p></div>
        <Button onClick={() => { setEditing(null); setIsFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> New Risk</Button>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Likelihood</TableHead><TableHead>Impact</TableHead><TableHead>Status</TableHead><TableHead>Owner</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
             : !items?.length ? <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No risks found.</TableCell></TableRow>
             : items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell><Badge variant={item.likelihood === 'Critical' || item.likelihood === 'High' ? 'destructive' : 'secondary'}>{item.likelihood}</Badge></TableCell>
                <TableCell><Badge variant={item.impact === 'Critical' || item.impact === 'High' ? 'destructive' : 'secondary'}>{item.impact}</Badge></TableCell>
                <TableCell><Badge variant={item.status === 'open' ? 'default' : 'secondary'}>{item.status}</Badge></TableCell>
                <TableCell>{item.owner?.fullName || '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setIsFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirm('Delete?') && deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <RiskFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} initialData={editing} />
    </div>
  );
}
