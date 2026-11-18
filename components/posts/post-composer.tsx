"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, FileText, LoaderCircle, Play, Send } from "lucide-react";
import type { ComposerProject } from "@/lib/posts";
import { Button } from "@/components/ui/button";

type Result = { postId?: string; status?: string; error?: string; results?: { ok: boolean; error?: string }[] };

export function PostComposer({ projects }: { projects: ComposerProject[] }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [content, setContent] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<"draft" | "publish" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const project = useMemo(() => projects.find((item) => item.id === projectId), [projectId, projects]);

  function selectProject(nextProjectId: string) {
    setProjectId(nextProjectId);
    setSelectedAccounts([]);
    setMessage(null);
  }

  function toggleAccount(accountId: string) {
    setSelectedAccounts((current) => current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId]);
  }

  async function submit(action: "draft" | "publish") {
    setMessage(null);
    setPendingAction(action);
    const response = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, content, socialAccountIds: selectedAccounts, action }) });
    const result = await response.json() as Result;
    setPendingAction(null);
    if (!response.ok) {
      setMessage({ type: "error", text: result.results?.find((item) => !item.ok)?.error ?? result.error ?? "The post could not be published." });
      return;
    }
    setMessage({ type: "success", text: action === "draft" ? "Draft saved successfully." : "LinkedIn post published successfully." });
    setContent("");
    setSelectedAccounts([]);
  }

  if (!projects.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><FileText className="mx-auto size-10 text-slate-300" /><h2 className="mt-4 font-bold text-slate-900">Create a project first</h2><p className="mt-1 text-sm text-slate-500">A post must belong to a project with at least one assigned social account.</p></div>;

  const linkedinAccounts = project?.accounts.filter((account) => account.platform === "linkedin") ?? [];
  const otherAccounts = project?.accounts.filter((account) => account.platform !== "linkedin") ?? [];

  return (
    <form className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.7fr)]" onSubmit={(event) => { event.preventDefault(); void submit("publish"); }}>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:p-6"><label className="block text-xs font-semibold text-slate-700">Project<select value={projectId} onChange={(event) => selectProject(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500">{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="mt-5 block text-xs font-semibold text-slate-700">Post content<textarea value={content} onChange={(event) => setContent(event.target.value)} required maxLength={3000} rows={12} placeholder="What would you like to share on LinkedIn?" className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-brand-500" /></label><div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>Text-only LinkedIn publishing</span><span className={content.length > 2850 ? "text-amber-600" : ""}>{content.length} / 3,000</span></div>{message && <div className={`mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{message.type === "success" && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}{message.text}</div>}<div className="mt-6 flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" disabled={Boolean(pendingAction) || !content.trim() || !selectedAccounts.length} onClick={() => void submit("draft")}>{pendingAction === "draft" ? <LoaderCircle className="size-4 animate-spin" /> : <FileText className="size-4" />}Save draft</Button><Button type="submit" disabled={Boolean(pendingAction) || !content.trim() || !selectedAccounts.length}>{pendingAction === "publish" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}Publish now</Button></div></section>

      <aside className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold text-slate-900">Publish to</h2><p className="mt-1 text-xs text-slate-500">Accounts assigned to {project?.name}</p><div className="mt-4 space-y-2">{linkedinAccounts.map((account) => <label key={account.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selectedAccounts.includes(account.id) ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}><input type="checkbox" checked={selectedAccounts.includes(account.id)} onChange={() => toggleAccount(account.id)} className="size-4 accent-violet-600" /><span className="grid size-9 place-items-center rounded-lg bg-[#0a66c2] text-white"><BriefcaseBusiness className="size-4" /></span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-800">{account.displayName}</span><span className="block truncate text-[10px] text-slate-400">{account.username ?? "LinkedIn profile"}</span></span></label>)}{!linkedinAccounts.length && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">Assign a connected LinkedIn account to this project before publishing.</p>}</div></section>{otherAccounts.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Play className="size-4 text-slate-400" /><h2 className="text-sm font-bold text-slate-900">Coming next</h2></div><p className="mt-2 text-xs leading-5 text-slate-500">YouTube publishing requires video upload and media storage. These accounts will be enabled in the next component.</p>{otherAccounts.map((account) => <div key={account.id} className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">{account.displayName} · <span className="capitalize">{account.platform}</span></div>)}</section>}</aside>
    </form>
  );
}
