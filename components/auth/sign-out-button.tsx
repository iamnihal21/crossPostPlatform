"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  return <button className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Sign out" onClick={async () => { const supabase = createSupabaseBrowserClient(); await supabase.auth.signOut(); router.replace("/login"); router.refresh(); }}><LogOut className="size-4" /></button>;
}
