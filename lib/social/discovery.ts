import type { SocialPlatform, SocialProviderId } from "@/lib/social/providers";

export type DiscoveredSocialAccount = {
  platform: SocialPlatform;
  externalAccountId: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  accountAccessToken?: string;
  metadata?: Record<string, unknown>;
};

async function providerFetch<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const payload = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "Could not read account information from the provider.");
  return payload;
}

export async function discoverSocialAccounts(provider: SocialProviderId, accessToken: string): Promise<DiscoveredSocialAccount[]> {
  switch (provider) {
    case "x": {
      const payload = await providerFetch<{ data: { id: string; name: string; username: string; profile_image_url?: string } }>("https://api.x.com/2/users/me?user.fields=id,name,username,profile_image_url", accessToken);
      return [{ platform: "x", externalAccountId: payload.data.id, displayName: payload.data.name, username: payload.data.username, avatarUrl: payload.data.profile_image_url }];
    }
    case "linkedin": {
      const payload = await providerFetch<{ sub: string; name: string; email?: string; picture?: string }>("https://api.linkedin.com/v2/userinfo", accessToken);
      return [{ platform: "linkedin", externalAccountId: payload.sub, displayName: payload.name, avatarUrl: payload.picture, metadata: { email: payload.email } }];
    }
    case "threads": {
      const payload = await providerFetch<{ id: string; username: string; threads_profile_picture_url?: string; threads_biography?: string }>("https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography", accessToken);
      return [{ platform: "threads", externalAccountId: payload.id, displayName: payload.username, username: payload.username, avatarUrl: payload.threads_profile_picture_url, metadata: { biography: payload.threads_biography } }];
    }
    case "google": {
      const payload = await providerFetch<{ items?: { id: string; snippet: { title: string; customUrl?: string; thumbnails?: { default?: { url: string } } } }[] }>("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", accessToken);
      return (payload.items ?? []).map((channel) => ({ platform: "youtube", externalAccountId: channel.id, displayName: channel.snippet.title, username: channel.snippet.customUrl, avatarUrl: channel.snippet.thumbnails?.default?.url }));
    }
    case "meta": {
      const version = process.env.META_GRAPH_VERSION ?? "v24.0";
      const fields = "id,name,picture,access_token,instagram_business_account{id,username,name,profile_picture_url}";
      const payload = await providerFetch<{ data?: Array<{ id: string; name: string; picture?: { data?: { url?: string } }; access_token?: string; instagram_business_account?: { id: string; username?: string; name?: string; profile_picture_url?: string } }> }>(`https://graph.facebook.com/${version}/me/accounts?fields=${encodeURIComponent(fields)}`, accessToken);
      return (payload.data ?? []).flatMap((page) => {
        const accounts: DiscoveredSocialAccount[] = [{ platform: "facebook", externalAccountId: page.id, displayName: page.name, avatarUrl: page.picture?.data?.url, accountAccessToken: page.access_token }];
        if (page.instagram_business_account) {
          const instagram = page.instagram_business_account;
          accounts.push({ platform: "instagram", externalAccountId: instagram.id, displayName: instagram.name ?? instagram.username ?? page.name, username: instagram.username, avatarUrl: instagram.profile_picture_url, accountAccessToken: page.access_token, metadata: { facebook_page_id: page.id } });
        }
        return accounts;
      });
    }
  }
}
