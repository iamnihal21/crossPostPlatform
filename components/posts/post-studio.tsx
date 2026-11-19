"use client";

import { useState } from "react";
import { BriefcaseBusiness, PlayCircle as Youtube } from "lucide-react";
import type { ComposerProject } from "@/lib/posts";
import { PostComposer } from "@/components/posts/post-composer";
import { YouTubeUploader } from "@/components/posts/youtube-uploader";

export function PostStudio({ projects }: { projects: ComposerProject[] }) {
  const [mode, setMode] = useState<"linkedin" | "youtube">("linkedin");
  return <div className="space-y-5"><div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Post type"><button type="button" role="tab" aria-selected={mode === "linkedin"} onClick={() => setMode("linkedin")} className={`flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${mode === "linkedin" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}><BriefcaseBusiness className="size-4" />LinkedIn text</button><button type="button" role="tab" aria-selected={mode === "youtube"} onClick={() => setMode("youtube")} className={`flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${mode === "youtube" ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}><Youtube className="size-4" />YouTube video</button></div>{mode === "linkedin" ? <PostComposer projects={projects} /> : <YouTubeUploader projects={projects} />}</div>;
}
