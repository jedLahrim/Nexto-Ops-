'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function PowerBIPage() {
  const [embedUrl, setEmbedUrl] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Power BI</h1>
        <p className="mt-1 text-sm text-muted-foreground">Embed and view Power BI dashboards</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embed a Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste your Power BI embed URL below to display an interactive dashboard inline.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => setShowEmbed(!!embedUrl)} disabled={!embedUrl}>
              <ExternalLink className="mr-2 h-4 w-4" /> Load
            </Button>
          </div>
          {showEmbed && embedUrl && (
            <div className="mt-4 rounded-lg border overflow-hidden" style={{ height: '600px' }}>
              <iframe
                title="Power BI Report"
                width="100%"
                height="100%"
                src={embedUrl}
                frameBorder="0"
                allowFullScreen
              />
            </div>
          )}
          {!showEmbed && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
                <BarChart3 className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Enter a Power BI embed URL above to display your dashboard here. Contact your administrator for the correct embed link.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
