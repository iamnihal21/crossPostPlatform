import { CheckCircle2, CircleAlert, ShieldCheck } from "lucide-react";
import { ConnectionAction } from "@/components/accounts/connection-action";
import { Card } from "@/components/ui/card";
import type { ProviderDefinition } from "@/lib/social/providers";

type ConnectedAccount = { id: string; platform: string; display_name: string; username: string | null; avatar_url: string | null };
type Connection = { id: string; status: string; social_accounts: ConnectedAccount[] };

export function ProviderCard({ provider, configured, connection }: { provider: ProviderDefinition; configured: boolean; connection?: Connection }) {
  const connected = connection?.status === "active";
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start gap-4">
        <div className="flex -space-x-2">{provider.platforms.map(({ id, icon: Icon }) => <span key={id} className="grid size-11 place-items-center rounded-xl border-2 border-white bg-slate-900 text-white shadow-sm"><Icon className="size-5" /></span>)}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-bold text-slate-950">{provider.name}</h2>{connected ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="size-3" />Connected</span> : !configured ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700"><CircleAlert className="size-3" />Credentials needed</span> : null}</div><p className="mt-1 text-xs leading-5 text-slate-500">{provider.description}</p></div>
      </div>

      {connection?.social_accounts?.length ? <div className="mt-5 space-y-2">{connection.social_accounts.map((account) => <div key={account.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><span className="grid size-8 place-items-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm">{account.display_name.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{account.display_name}</p><p className="truncate text-[10px] capitalize text-slate-400">{account.username ? `@${account.username}` : account.platform}</p></div></div>)}</div> : <div className="mt-5 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mr-1 inline size-4 text-brand-600" />Postlane requests only the permissions needed for publishing and analytics.</div>}

      <p className="mt-4 text-[10px] leading-4 text-slate-400">{provider.setupNote}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5"><span className="text-[10px] text-slate-400">{provider.scopes.length} permissions</span><ConnectionAction provider={provider.id} configured={configured} connectionId={connection?.id} /></div>
    </Card>
  );
}
