import type { Metadata } from "next";
import Link from "next/link";
import { DatabaseZap, LockKeyhole } from "lucide-react";
import { ProjectManager, type ProjectView, type SocialAccountOption } from "@/components/projects/project-manager";
import { isSupabaseConfigured } from "@/lib/env";
import { listProjectsForUser } from "@/lib/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let authenticated = false;
  let setupError = "";
  let projects: ProjectView[] = [];
  let accounts: SocialAccountOption[] = [];
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      authenticated = Boolean(user);
      if (user) {
        const result = await listProjectsForUser(user);
        projects = result.projects as ProjectView[];
        accounts = result.accounts as SocialAccountOption[];
      }
    } catch (error) {
      setupError = error instanceof Error ? error.message : "Projects database setup is incomplete.";
    }
  }

  return <div className="space-y-6"><header><p className="eyebrow">Workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Projects</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Keep every brand or client separate, with its own accounts, content and analytics.</p></header>{!authenticated && <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"><LockKeyhole className="mt-0.5 size-4 shrink-0" /><p className="flex-1">Sign in before managing workspace projects.</p><Link href="/login" className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white">Sign in</Link></div>}{setupError && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><DatabaseZap className="mt-0.5 size-4 shrink-0" /><p>Apply the latest Supabase projects migration before using this page. {setupError}</p></div>}<ProjectManager projects={projects} accounts={accounts} enabled={authenticated && !setupError} /></div>;
}
