"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, LoaderCircle, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SocialProviderId } from "@/lib/social/providers";

type Props = { provider: SocialProviderId; configured: boolean; connectionId?: string };

export function ConnectionAction({ provider, configured, connectionId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!connectionId) {
    return (
      <Button disabled={!configured} onClick={() => { setPending(true); window.location.assign(`/api/oauth/${provider}/start`); }}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Link2 className="size-4" />}
        {configured ? "Connect" : "Setup required"}
      </Button>
    );
  }

  async function disconnect() {
    if (!window.confirm("Disconnect this provider? Scheduled posts using its accounts will no longer publish.")) return;
    setPending(true);
    const response = await fetch(`/api/social-connections/${connectionId}`, { method: "DELETE" });
    setPending(false);
    if (response.ok) router.refresh();
  }

  return <Button variant="secondary" onClick={disconnect} disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Unplug className="size-4" />}Disconnect</Button>;
}
