export type SummaryMetric = { id: "published" | "reach" | "engagement" | "scheduled"; label: string; value: string; change: string; context: string };
export type UpcomingPost = { id: string; day: string; month: string; title: string; time: string; project: string; platforms: string[] };
export type RecentPost = { id: string; title: string; platform: string; publishedAt: string; reach: string; engagement: string };

export const summaryMetrics: SummaryMetric[] = [
  { id: "published", label: "Posts published", value: "24", change: "↑ 18%", context: "vs previous period" },
  { id: "reach", label: "Total reach", value: "128.4K", change: "↑ 12.5%", context: "vs previous period" },
  { id: "engagement", label: "Engagement", value: "8.7%", change: "↑ 2.1%", context: "vs previous period" },
  { id: "scheduled", label: "Scheduled", value: "8", change: "Next", context: "post in 2h 14m" },
];

export const upcomingPosts: UpcomingPost[] = [
  { id: "up-1", day: "18", month: "NOV", title: "Building better products starts with...", time: "10:30 AM", project: "Acme Products", platforms: ["LinkedIn", "X"] },
  { id: "up-2", day: "18", month: "NOV", title: "A closer look at the details ✨", time: "4:00 PM", project: "Acme Products", platforms: ["Instagram", "Facebook"] },
  { id: "up-3", day: "19", month: "NOV", title: "Three lessons from our latest launch", time: "9:15 AM", project: "Acme Products", platforms: ["X", "Threads"] },
];

export const recentPosts: RecentPost[] = [
  { id: "post-1", title: "Five ways to make your workflow feel lighter...", platform: "LinkedIn", publishedAt: "Nov 15, 10:30 AM", reach: "18.2K", engagement: "9.4%" },
  { id: "post-2", title: "A 30-second tour of our new dashboard", platform: "YouTube", publishedAt: "Nov 14, 6:00 PM", reach: "32.8K", engagement: "12.1%" },
  { id: "post-3", title: "Big ideas start with a simple sketch", platform: "Instagram", publishedAt: "Nov 13, 4:15 PM", reach: "24.1K", engagement: "8.7%" },
];
