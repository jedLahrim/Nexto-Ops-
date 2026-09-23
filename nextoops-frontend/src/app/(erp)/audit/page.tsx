'use client';

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText } from "lucide-react";
import { auditService } from "@/services/audit.service";

// Format date utility inline to avoid missing imports
function fmtDateTime(timestamp?: number | string | Date) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AuditPage() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['auditRecent'],
    queryFn: auditService.getRecent,
  });

  const rows = (entries?.data ?? []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Append-only record of administrative actions (latest 50). Entries are never edited or
          deleted by normal administrators.
        </p>
      </div>

      <Card className="overflow-hidden shadow-none">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <ScrollText className="size-8 text-muted-foreground" />
            <p className="font-medium">No audit entries yet</p>
            <p className="text-sm text-muted-foreground">
              Actions like asset creation, stock movements and role changes will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {fmtDateTime(e.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">{e.userLabel ?? "—"}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                        {e.action}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{e.entity}</TableCell>
                    <TableCell className="max-w-72 truncate text-sm text-muted-foreground">
                      {e.details ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
