'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, Calendar, TrendingUp, Users, Package, ShieldAlert } from "lucide-react";

const reports = [
  { title: 'Incident Report', description: 'Summary of all incidents by status, priority, and category', icon: ShieldAlert, color: 'text-red-500' },
  { title: 'Asset Utilization', description: 'Breakdown of IT assets by assignment, status, and age', icon: Package, color: 'text-blue-500' },
  { title: 'Budget Overview', description: 'YTD budget vs. actual spending by department', icon: TrendingUp, color: 'text-green-500' },
  { title: 'Vendor Performance', description: 'SLA compliance, contract values, and delivery metrics', icon: Users, color: 'text-purple-500' },
  { title: 'License Compliance', description: 'Software license usage, expirations, and cost analysis', icon: Calendar, color: 'text-orange-500' },
  { title: 'Maintenance Schedule', description: 'Upcoming and overdue maintenance activities', icon: Calendar, color: 'text-cyan-500' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generate and download operational reports</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${r.color}`}>
                <r.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-medium">{r.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">{r.description}</p>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="mr-2 h-3 w-3" /> Generate Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
