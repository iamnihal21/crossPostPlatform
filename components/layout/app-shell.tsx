"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={navigationOpen} onClose={() => setNavigationOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onOpenNavigation={() => setNavigationOpen(true)} />
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
