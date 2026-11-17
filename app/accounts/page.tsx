import type { Metadata } from "next";
import { Info, LockKeyhole } from "lucide-react";
import { ProviderCard } from "@/components/accounts/provider-card";
import { isSupabaseConfigured } from "@/lib/env";
import { listSocialConnections } from "@/lib/social/connections";
import { getConfiguredProviders, providerDefinitions, socialProviderIds, type SocialProviderId } from "@/lib/social/providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Connected accounts" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ connected?: string; error?: string; provider?: string }>;

export default async function AccountsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const configuredProviders = getConfiguredProviders();
  let authenticated = false;
  let connections: Awaited<ReturnType<typeof listSocialConnections>>["connections"] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      authenticated = Boolean(user);
      if (user) ({ connections } = await listSocialConnections(user.id));
    } catch { /* The setup banner below explains incomplete configuration. */ }
  }

  return (
    <div className="space-y-6">
      <header><p className="eyebrow">Integrations</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Connected accounts</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Authorize the channels Postlane can publish to and read analytics from.</p></header>

      {query.connected && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Account connected successfully. Its available channels are ready to use.</div>}
      {query.error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">The connection could not be completed. Check authentication, callback URLs and provider credentials, then try again.</div>}
      {!authenticated && <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"><LockKeyhole className="mt-0.5 size-4 shrink-0" /><p>Authentication and Supabase must be configured before live account connections can be stored. Provider cards remain visible so setup can be verified safely.</p></div>}

      <div className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500"><Info className="mt-0.5 size-4 shrink-0 text-brand-600" /><p>Facebook Pages and Instagram professional accounts share one Meta connection. Threads is authorized separately. Personal Facebook profiles cannot be used for automated publishing.</p></div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Social providers">
        {socialProviderIds.map((providerId) => {
          const connection = connections.find((item) => item.provider === providerId);
          return <ProviderCard key={providerId} provider={providerDefinitions[providerId]} configured={configuredProviders.includes(providerId as SocialProviderId)} connection={connection} />;
        })}
      </section>
    </div>
  );
}
