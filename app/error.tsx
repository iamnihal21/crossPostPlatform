"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-50 text-amber-600"><AlertTriangle aria-hidden /></span>
        <h1 className="mt-4 text-xl font-bold text-slate-950">We couldn&apos;t load this page</h1>
        <p className="mt-2 text-sm text-slate-500">Try again. If the problem continues, the error will be available in monitoring.</p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
