"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Archive, FolderKanban, LoaderCircle, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type SocialAccountOption = { id: string; platform: string; display_name: string; username: string | null; avatar_url: string | null };
export type ProjectView = { id: string; name: string; slug: string; description: string; color: string; timezone: string; status: "active" | "archived"; created_at: string; project_social_accounts: { social_account_id: string }[] };

const timezones = ["UTC", "Asia/Kolkata", "Europe/London", "America/New_York", "America/Los_Angeles"];
const colors = ["#6553d9", "#2563eb", "#0f9f6e", "#e8792f", "#dc3f6a", "#334155"];

export function ProjectManager({ projects, accounts, enabled }: { projects: ProjectView[]; accounts: SocialAccountOption[]; enabled: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProjectView | null | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const activeProjects = useMemo(() => projects.filter((project) => project.status === "active"), [projects]);
  const archivedProjects = useMemo(() => projects.filter((project) => project.status === "archived"), [projects]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      color: String(form.get("color") ?? colors[0]),
      timezone: String(form.get("timezone") ?? "UTC"),
      socialAccountIds: form.getAll("socialAccountIds").map(String),
      status: editing?.status ?? "active",
    };
    const response = await fetch(editing ? `/api/projects/${editing.id}` : "/api/projects", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { error?: string };
    setPending(false);
    if (!response.ok) { setError(result.error ?? "Could not save the project."); return; }
    setEditing(undefined);
    router.refresh();
  }

  async function archive(project: ProjectView) {
    if (!window.confirm(`Archive ${project.name}? Existing posts will be preserved.`)) return;
    setPending(true);
    const response = await fetch(`/api/projects/${project.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: project.name, description: project.description, color: project.color, timezone: project.timezone, socialAccountIds: project.project_social_accounts.map((item) => item.social_account_id), status: "archived" }) });
    setPending(false);
    if (response.ok) router.refresh();
  }

  return (
    <>
      <div className="flex justify-end"><Button onClick={() => { setEditing(null); setError(""); }} disabled={!enabled}><Plus className="size-4" />New project</Button></div>
      {!activeProjects.length ? <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><FolderKanban /></span><h2 className="mt-4 font-bold text-slate-900">Create your first project</h2><p className="mt-1 text-sm text-slate-500">Group connected accounts, content and analytics by brand or client.</p></div></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{activeProjects.map((project) => <article key={project.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.035)]"><div className="h-1.5" style={{ backgroundColor: project.color }} /><div className="p-5"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl text-white" style={{ backgroundColor: project.color }}><FolderKanban className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="truncate font-bold text-slate-950">{project.name}</h2><p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-slate-500">{project.description || "No description yet."}</p></div></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-[10px] uppercase tracking-wider text-slate-400">Accounts</p><p className="mt-0.5 text-xs font-semibold text-slate-700">{project.project_social_accounts.length} connected</p></div><div className="flex gap-1"><button onClick={() => { setEditing(project); setError(""); }} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${project.name}`}><Pencil className="size-4" /></button><button onClick={() => archive(project)} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-700" aria-label={`Archive ${project.name}`}><Archive className="size-4" /></button></div></div></div></article>)}</div>}

      {archivedProjects.length > 0 && <details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Archived projects ({archivedProjects.length})</summary><div className="mt-3 space-y-2">{archivedProjects.map((project) => <div key={project.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500"><span className="size-3 rounded-full" style={{ backgroundColor: project.color }} />{project.name}</div>)}</div></details>}

      {editing !== undefined && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title"><form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="eyebrow">Workspace project</p><h2 id="project-dialog-title" className="mt-1 text-xl font-bold text-slate-950">{editing ? "Edit project" : "New project"}</h2></div><button type="button" onClick={() => setEditing(undefined)} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="size-5" /></button></div><div className="mt-5 space-y-4"><label className="block text-xs font-semibold text-slate-700">Name<input name="name" defaultValue={editing?.name} required maxLength={100} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500" /></label><label className="block text-xs font-semibold text-slate-700">Description<textarea name="description" defaultValue={editing?.description} maxLength={500} rows={3} className="mt-2 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-500" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-700">Timezone<select name="timezone" defaultValue={editing?.timezone ?? "UTC"} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">{timezones.map((timezone) => <option key={timezone}>{timezone}</option>)}</select></label><fieldset><legend className="text-xs font-semibold text-slate-700">Color</legend><div className="mt-3 flex gap-2">{colors.map((color) => <label key={color} className="cursor-pointer"><input type="radio" name="color" value={color} defaultChecked={(editing?.color ?? colors[0]) === color} className="peer sr-only" /><span className="block size-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-slate-400" style={{ backgroundColor: color }} /></label>)}</div></fieldset></div><fieldset><legend className="text-xs font-semibold text-slate-700">Connected accounts</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{accounts.length ? accounts.map((account) => <label key={account.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-xs"><input type="checkbox" name="socialAccountIds" value={account.id} defaultChecked={editing?.project_social_accounts.some((item) => item.social_account_id === account.id)} className="size-4 accent-violet-600" /><span className="min-w-0"><span className="block truncate font-semibold text-slate-700">{account.display_name}</span><span className="block capitalize text-slate-400">{account.platform}</span></span></label>) : <p className="col-span-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Connect a social account before assigning it to this project.</p>}</div></fieldset>{error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}</div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEditing(undefined)}>Cancel</Button><Button type="submit" disabled={pending}>{pending && <LoaderCircle className="size-4 animate-spin" />}{editing ? "Save changes" : "Create project"}</Button></div></form></div>}
    </>
  );
}
