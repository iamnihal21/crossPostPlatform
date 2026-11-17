import { ArrowUpRight, CalendarClock, Eye, Heart, Send } from "lucide-react";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { UpcomingPosts } from "@/components/dashboard/upcoming-posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { recentPosts, summaryMetrics, upcomingPosts } from "@/lib/dashboard-data";

const metricIcons = { published: Send, reach: Eye, engagement: Heart, scheduled: CalendarClock };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Tuesday, November 17</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Good morning, Arjun <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening across your social channels.</p>
        </div>
        <Button variant="secondary" size="sm">
          Last 7 days
          <ArrowUpRight className="size-4" aria-hidden />
        </Button>
      </header>

      <section aria-label="Performance summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} icon={metricIcons[metric.id]} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <Card className="min-h-80">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Performance</h2>
              <p className="section-description">Reach across all connected platforms</p>
            </div>
            <Button variant="ghost" size="sm">All platforms</Button>
          </div>
          <div className="mt-8 flex h-52 items-end gap-3" aria-label="Seven day reach chart">
            {[42, 58, 51, 68, 61, 79, 88].map((height, index) => (
              <div key={height + index} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="group relative flex-1 rounded-lg bg-violet-50">
                  <div className="absolute inset-x-0 bottom-0 rounded-lg bg-violet-500 transition-colors group-hover:bg-violet-600" style={{ height: `${height}%` }} />
                </div>
                <span className="text-center text-[10px] text-slate-400">{10 + index} Nov</span>
              </div>
            ))}
          </div>
        </Card>
        <UpcomingPosts posts={upcomingPosts} />
      </div>

      <ActivityTable posts={recentPosts} />
    </div>
  );
}
