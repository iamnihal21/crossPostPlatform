"use client";

import { Bell, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar({ onOpenNavigation }: { onOpenNavigation: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-10">
      <button className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onOpenNavigation} aria-label="Open navigation"><Menu className="size-5" /></button>
      <div className="ml-auto flex items-center gap-2">
        <button className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500 ring-2 ring-white" /></button>
        <Button size="sm"><Plus className="size-4" aria-hidden /><span className="hidden sm:inline">Create post</span><span className="sm:hidden">Create</span></Button>
      </div>
    </header>
  );
}
