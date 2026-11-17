import { MoreHorizontal } from "lucide-react";
import type { RecentPost } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";

export function ActivityTable({ posts }: { posts: RecentPost[] }) {
  return (
    <Card>
      <div><h2 className="section-title">Recent posts</h2><p className="section-description">Latest performance across your channels</p></div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-3 font-semibold">Post</th><th className="pb-3 font-semibold">Platform</th><th className="pb-3 font-semibold">Published</th><th className="pb-3 font-semibold">Reach</th><th className="pb-3 font-semibold">Engagement</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{posts.map((post) => <tr key={post.id} className="border-b border-slate-100 last:border-0"><td className="py-4 pr-6 font-medium text-slate-800">{post.title}</td><td className="py-4 pr-6"><span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{post.platform}</span></td><td className="py-4 pr-6 text-slate-500">{post.publishedAt}</td><td className="py-4 pr-6 font-semibold text-slate-700">{post.reach}</td><td className="py-4 pr-6 font-semibold text-slate-700">{post.engagement}</td><td className="py-4 text-right"><button className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label={`Actions for ${post.title}`}><MoreHorizontal className="size-4" /></button></td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  );
}
