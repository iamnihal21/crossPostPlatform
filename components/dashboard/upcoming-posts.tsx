import { Clock3 } from "lucide-react";
import type { UpcomingPost } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";

export function UpcomingPosts({ posts }: { posts: UpcomingPost[] }) {
  return (
    <Card>
      <div><h2 className="section-title">Upcoming</h2><p className="section-description">Your next scheduled posts</p></div>
      <div className="mt-4 divide-y divide-slate-100">
        {posts.map((post) => (
          <article key={post.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
            <div className="h-11 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 text-center"><span className="block bg-brand-50 py-0.5 text-[9px] font-bold text-brand-700">{post.month}</span><span className="block pt-0.5 text-sm font-bold">{post.day}</span></div>
            <div className="min-w-0 flex-1"><h3 className="truncate text-xs font-semibold text-slate-800">{post.title}</h3><p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><Clock3 className="size-3" />{post.time} · {post.project}</p></div>
            <div className="flex -space-x-1.5" aria-label={`Publishing to ${post.platforms.join(", ")}`}>{post.platforms.map((platform) => <span key={platform} title={platform} className="grid size-6 place-items-center rounded-full border-2 border-white bg-slate-800 text-[8px] font-bold uppercase text-white">{platform.slice(0, 2)}</span>)}</div>
          </article>
        ))}
      </div>
    </Card>
  );
}
