"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, FileVideo2, LoaderCircle, PlayCircle as Youtube, Upload } from "lucide-react";
import type { ComposerProject } from "@/lib/posts";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
type ApiResult = { targetId?: string; uploadUrl?: string; videoId?: string; error?: string };

async function inspectVideo(file: File) {
  if (!VIDEO_TYPES.includes(file.type)) throw new Error("Choose an MP4, WebM, or MOV video.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Video files are limited to 2 GB.");
  const objectUrl = URL.createObjectURL(file);
  try {
    const details = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
      video.onerror = () => reject(new Error("The browser could not read this video's metadata."));
      video.src = objectUrl;
    });
    if (!Number.isFinite(details.duration) || details.duration > 180) throw new Error("For this Shorts workflow, choose a video no longer than 3 minutes.");
    if (details.width > details.height) throw new Error("Choose a vertical or square video for YouTube Shorts.");
    return details;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function uploadFile(uploadUrl: string, file: File, onProgress: (value: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader("Content-Type", file.type);
    request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); };
    request.onerror = () => reject(new Error("The browser lost connection while uploading to YouTube."));
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) return reject(new Error(`YouTube rejected the video upload (${request.status}).`));
      try {
        const videoId = (JSON.parse(request.responseText) as { id?: string }).id;
        if (!videoId) throw new Error("YouTube did not return a video ID.");
        resolve(videoId);
      } catch (error) { reject(error); }
    };
    request.send(file);
  });
}

export function YouTubeUploader({ projects }: { projects: ComposerProject[] }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const project = useMemo(() => projects.find((item) => item.id === projectId), [projectId, projects]);
  const accounts = project?.accounts.filter((account) => account.platform === "youtube") ?? [];
  const [accountId, setAccountId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "unlisted" | "public">("private");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function changeProject(value: string) { setProjectId(value); setAccountId(""); setMessage(null); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !accountId) return;
    setBusy(true); setMessage(null); setProgress(0);
    let targetId = "";
    try {
      await inspectVideo(file);
      const startResponse = await fetch("/api/youtube/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, socialAccountId: accountId, title, description, privacy, fileName: file.name, mimeType: file.type, fileSize: file.size }) });
      const start = await startResponse.json() as ApiResult;
      if (!startResponse.ok || !start.uploadUrl || !start.targetId) throw new Error(start.error ?? "The YouTube upload could not be started.");
      targetId = start.targetId;
      const videoId = await uploadFile(start.uploadUrl, file, setProgress);
      const finishResponse = await fetch(`/api/youtube/uploads/${targetId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed", videoId }) });
      const finish = await finishResponse.json() as ApiResult;
      if (!finishResponse.ok) throw new Error(finish.error ?? "The uploaded video could not be verified.");
      setMessage({ type: "success", text: `Video uploaded successfully. YouTube ID: ${videoId}` });
      setTitle(""); setDescription(""); setFile(null); setProgress(100);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      const text = error instanceof Error ? error.message : "The video could not be uploaded.";
      if (targetId) void fetch(`/api/youtube/uploads/${targetId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "failed", error: text }) });
      setMessage({ type: "error", text });
    } finally { setBusy(false); }
  }

  if (!projects.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><FileVideo2 className="mx-auto size-10 text-slate-300" /><h2 className="mt-4 text-base font-bold text-slate-900">Create a project first</h2><p className="mt-1 text-sm text-slate-500">Assign your YouTube channel to a project before uploading.</p></div>;

  return <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.7fr)]"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:p-6"><label className="block text-sm font-semibold text-slate-700">Project<select value={projectId} onChange={(event) => changeProject(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500">{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="mt-5 block text-sm font-semibold text-slate-700">Video title<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500" placeholder="Give your Short a clear title" /></label><label className="mt-5 block text-sm font-semibold text-slate-700">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={6} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-brand-500" placeholder="Add context, links, and hashtags" /></label><label className="mt-5 block text-sm font-semibold text-slate-700">Video file<input ref={inputRef} type="file" required accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 p-4 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold" /></label><p className="mt-2 text-sm text-slate-500">Vertical or square · up to 3 minutes · MP4, WebM, or MOV · maximum 2 GB</p>{busy && <div className="mt-5"><div className="mb-2 flex justify-between text-sm font-medium text-slate-600"><span>{progress ? "Uploading directly to YouTube" : "Preparing secure upload"}</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-red-600 transition-all" style={{ width: `${Math.max(progress, 3)}%` }} /></div></div>}{message && <div className={`mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{message.type === "success" && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}{message.text}</div>}<div className="mt-6 flex justify-end"><Button type="submit" disabled={busy || !file || !accountId || !title.trim()}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}Upload now</Button></div></section><aside className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Youtube className="size-5 text-red-600" /><h2 className="text-base font-bold text-slate-900">YouTube channel</h2></div><div className="mt-4 space-y-2">{accounts.map((account) => <label key={account.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${accountId === account.id ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}><input type="radio" name="youtube-account" checked={accountId === account.id} onChange={() => setAccountId(account.id)} className="size-4 accent-red-600" /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{account.displayName}</span><span className="block truncate text-sm text-slate-500">{account.username ?? "YouTube channel"}</span></span></label>)}{!accounts.length && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">Assign your connected YouTube channel to this project first.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><label className="block text-sm font-semibold text-slate-700">Visibility<select value={privacy} onChange={(event) => setPrivacy(event.target.value as typeof privacy)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></label><p className="mt-3 text-sm leading-5 text-slate-500">Private is safest for testing. Google may force unverified OAuth apps to upload privately.</p></section></aside></form>;
}
