"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Settings, X, type LucideIcon } from "lucide-react";
import { primaryNavigation, workspaceNavigation } from "@/lib/navigation";

type SidebarProps = { open: boolean; onClose: () => void };

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  return (
    <>
      {open && <button className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-10 items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-950" onClick={onClose}>
            <span className="grid size-8 place-items-center rounded-xl bg-brand-600 text-sm text-white shadow-sm shadow-violet-200">P</span>
            <span className="text-lg">postlane</span>
          </Link>
          <button className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close menu"><X className="size-5" /></button>
        </div>

        <button className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:border-slate-300">
          <span className="grid size-9 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">AP</span>
          <span className="min-w-0 flex-1"><span className="block text-[10px] text-slate-400">Workspace</span><span className="block truncate text-xs font-semibold text-slate-800">Acme Products</span></span>
          <ChevronDown className="size-4 text-slate-400" aria-hidden />
        </button>

        <nav className="mt-6 space-y-1" aria-label="Main navigation">
          {primaryNavigation.map((item) => <NavigationLink key={item.label} item={item} active={pathname === item.href} onClick={onClose} />)}
        </nav>
        <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <nav className="space-y-1" aria-label="Workspace navigation">
          {workspaceNavigation.map((item) => <NavigationLink key={item.label} item={item} active={pathname === item.href} onClick={onClose} />)}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <NavigationLink item={{ label: "Settings", href: "/settings", icon: Settings }} active={pathname === "/settings"} onClick={onClose} />
          <div className="mt-3 flex items-center gap-3 rounded-xl p-2">
            <span className="grid size-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">AS</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">Arjun Sharma</span><span className="block truncate text-[10px] text-slate-400">arjun@acme.co</span></span>
            <button className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Sign out"><LogOut className="size-4" /></button>
          </div>
        </div>
      </aside>
    </>
  );
}

type NavigationItem = { label: string; href: string; icon: LucideIcon; badge?: string };
function NavigationLink({ item, active, onClick }: { item: NavigationItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
      <Icon className="size-[18px]" aria-hidden /><span className="flex-1">{item.label}</span>{item.badge && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">{item.badge}</span>}
    </Link>
  );
}
