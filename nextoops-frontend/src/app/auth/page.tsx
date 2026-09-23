'use client';

import { Suspense, useState } from "react";
import AuthPanel from "@/components/auth/AuthPanel";
import { Loader2 } from "lucide-react";

interface AuthProps {
  redirectAfterAuth?: string;
}

function AuthInner({ redirectAfterAuth }: AuthProps) {
  const [showRequest, setShowRequest] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_70%_-10%,--theme(--color-primary/10%),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div className="relative flex flex-1 items-center justify-center px-4 py-10">
        <AuthPanel
          redirectAfterAuth={redirectAfterAuth}
          showAccessRequest={showRequest}
          onToggleAccessRequest={() => setShowRequest((v) => !v)}
        />
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthInner {...props} />
    </Suspense>
  );
}
