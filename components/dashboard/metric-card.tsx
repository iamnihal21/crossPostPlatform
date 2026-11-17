import type { LucideIcon } from "lucide-react";
import type { SummaryMetric } from "@/lib/dashboard-data";
import { Card } from "@/components/ui/card";

export function MetricCard({ metric, icon: Icon }: { metric: SummaryMetric; icon: LucideIcon }) {
  return (
    <Card className="p-5 sm:p-5">
      <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{metric.label}</p><span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-[18px]" aria-hidden /></span></div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{metric.value}</p>
      <p className="mt-1 text-[11px] text-slate-400"><span className="font-semibold text-emerald-600">{metric.change}</span> {metric.context}</p>
    </Card>
  );
}
