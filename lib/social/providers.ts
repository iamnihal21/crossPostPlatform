import type { LucideIcon } from "lucide-react";
import { AtSign, BriefcaseBusiness, Camera, Play, Users } from "lucide-react";

export const socialProviderIds = ["x", "linkedin", "meta", "threads", "google"] as const;
export type SocialProviderId = (typeof socialProviderIds)[number];
export type SocialPlatform = "x" | "linkedin" | "facebook" | "instagram" | "threads" | "youtube";

export type ProviderDefinition = {
  id: SocialProviderId;
  name: string;
  description: string;
  platforms: { id: SocialPlatform; name: string; icon: LucideIcon }[];
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  scopeSeparator: " " | ",";
  supportsPkce: boolean;
  setupNote: string;
};

export const providerDefinitions: Record<SocialProviderId, ProviderDefinition> = {
  x: {
    id: "x",
    name: "X",
    description: "Publish posts and read account performance.",
    platforms: [{ id: "x", name: "X", icon: AtSign }],
    authorizationUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.x.com/2/oauth2/token",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    scopeSeparator: " ",
    supportsPkce: true,
    setupNote: "Requires an X developer project with OAuth 2.0 enabled.",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    description: "Publish to member profiles and approved organization pages.",
    platforms: [{ id: "linkedin", name: "LinkedIn", icon: BriefcaseBusiness }],
    authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "email", "w_member_social"],
    scopeSeparator: " ",
    supportsPkce: false,
    setupNote: "Organization publishing needs additional LinkedIn product approval.",
  },
  meta: {
    id: "meta",
    name: "Facebook & Instagram",
    description: "Connect Facebook Pages and their Instagram professional accounts.",
    platforms: [{ id: "facebook", name: "Facebook", icon: Users }, { id: "instagram", name: "Instagram", icon: Camera }],
    authorizationUrl: "https://www.facebook.com/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/oauth/access_token",
    scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "instagram_manage_insights", "read_insights"],
    scopeSeparator: ",",
    supportsPkce: false,
    setupNote: "Instagram publishing requires a professional account connected to a Facebook Page.",
  },
  threads: {
    id: "threads",
    name: "Threads",
    description: "Publish Threads posts and read account insights.",
    platforms: [{ id: "threads", name: "Threads", icon: AtSign }],
    authorizationUrl: "https://threads.net/oauth/authorize",
    tokenUrl: "https://graph.threads.net/oauth/access_token",
    scopes: ["threads_basic", "threads_content_publish", "threads_manage_insights"],
    scopeSeparator: ",",
    supportsPkce: false,
    setupNote: "Threads uses a separate Meta authorization flow.",
  },
  google: {
    id: "google",
    name: "YouTube",
    description: "Upload videos and read YouTube channel analytics.",
    platforms: [{ id: "youtube", name: "YouTube Shorts", icon: Play }],
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "profile", "email", "https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/yt-analytics.readonly"],
    scopeSeparator: " ",
    supportsPkce: true,
    setupNote: "Google may require OAuth verification before external users can connect.",
  },
};

export function isSocialProvider(value: string): value is SocialProviderId {
  return socialProviderIds.includes(value as SocialProviderId);
}

export function getProviderCredentials(provider: SocialProviderId) {
  const prefix = provider === "google" ? "GOOGLE" : provider === "meta" ? "META" : provider === "threads" ? "THREADS" : provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) throw new Error(`${providerDefinitions[provider].name} OAuth credentials are not configured.`);
  return { clientId, clientSecret };
}

export function getConfiguredProviders(): SocialProviderId[] {
  return socialProviderIds.filter((provider) => {
    try { getProviderCredentials(provider); return true; } catch { return false; }
  });
}
