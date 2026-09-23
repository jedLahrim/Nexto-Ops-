'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, ExternalLink, Shield, Wrench, Server, Network } from "lucide-react";

const docCategories = [
  {
    title: 'IT Policies',
    icon: Shield,
    color: 'text-blue-500',
    docs: [
      { title: 'Acceptable Use Policy', updated: 'Mar 2026' },
      { title: 'Information Security Policy', updated: 'Jan 2026' },
      { title: 'Data Classification Policy', updated: 'Feb 2026' },
    ]
  },
  {
    title: 'Standard Operating Procedures',
    icon: Wrench,
    color: 'text-green-500',
    docs: [
      { title: 'Incident Management SOP', updated: 'Sep 2026' },
      { title: 'Change Management SOP', updated: 'Aug 2026' },
      { title: 'Onboarding Checklist', updated: 'Jul 2026' },
    ]
  },
  {
    title: 'Infrastructure Docs',
    icon: Server,
    color: 'text-purple-500',
    docs: [
      { title: 'Network Architecture Diagram', updated: 'Jun 2026' },
      { title: 'DR / BCP Plan', updated: 'May 2026' },
      { title: 'Server Inventory & Config', updated: 'Sep 2026' },
    ]
  },
  {
    title: 'Network Guides',
    icon: Network,
    color: 'text-orange-500',
    docs: [
      { title: 'VPN Configuration Guide', updated: 'Apr 2026' },
      { title: 'Firewall Rules Documentation', updated: 'Mar 2026' },
      { title: 'Wi-Fi Setup & Troubleshooting', updated: 'Feb 2026' },
    ]
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
        <p className="mt-1 text-sm text-muted-foreground">IT policies, SOPs, and knowledge base</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {docCategories.map((cat) => (
          <Card key={cat.title}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${cat.color}`}>
                <cat.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-medium">{cat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {cat.docs.map((doc) => (
                  <li key={doc.title} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{doc.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{doc.updated}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
