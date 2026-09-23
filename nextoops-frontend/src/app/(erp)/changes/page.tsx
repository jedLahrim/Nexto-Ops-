'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncidentStatusBadge, PriorityBadge } from "@/components/entity-badges";
import { format } from "date-fns";
import { Loader2, MessageSquare, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketThreadDialog } from "@/components/tickets/TicketThread";
import { TicketFormDialog } from "@/components/tickets/TicketFormDialog";
import { toast } from "sonner";

export default function ChangesPage() {
  const queryClient = useQueryClient();
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/itsm/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changes'] });
      toast.success('Change request deleted');
    }
  });

  const { data: changes, isLoading } = useQuery({
    queryKey: ['changes'],
    queryFn: async () => {
      const res = await api.get('/itsm/changes');
      return res.data;
    }
  });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Changes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage change requests and approvals.
          </p>
        </div>
        <Button onClick={() => { setEditingTicket(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Change Request
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Change ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !changes || changes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No change requests found.
                </TableCell>
              </TableRow>
            ) : (
              changes.map((change: any) => (
                <TableRow key={change.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{change.ticketNumber}</TableCell>
                  <TableCell>{change.title}</TableCell>
                  <TableCell>
                    <IncidentStatusBadge status={change.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={change.priority} />
                  </TableCell>
                  <TableCell>{change.reporter?.fullName || change.reporter?.email || 'System'}</TableCell>
                  <TableCell>{format(new Date(change.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTicketId(change.id);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTicket(change);
                        setIsFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this change request?')) {
                          deleteMutation.mutate(change.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <TicketThreadDialog 
        incidentId={activeTicketId} 
        onOpenChange={(open) => !open && setActiveTicketId(null)} 
      />

      <TicketFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        type="changes"
        initialData={editingTicket}
      />
    </div>
  );
}
