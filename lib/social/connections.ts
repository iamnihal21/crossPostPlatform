import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/social/crypto";
import type { DiscoveredSocialAccount } from "@/lib/social/discovery";
import type { OAuthTokenSet } from "@/lib/social/oauth";
import type { SocialProviderId } from "@/lib/social/providers";

export async function getDefaultWorkspaceId(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("workspace_members").select("workspace_id").eq("user_id", userId).order("created_at").limit(1).maybeSingle();
  if (error) throw error;
  return data?.workspace_id as string | undefined;
}

export async function assertWorkspaceMembership(userId: string, workspaceId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("workspace_members").select("workspace_id").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle();
  if (error || !data) throw new Error("You do not have access to this workspace.");
}

export async function saveSocialConnection(input: { user: User; workspaceId: string; provider: SocialProviderId; tokens: OAuthTokenSet; accounts: DiscoveredSocialAccount[] }) {
  const admin = createSupabaseAdminClient();
  const accessTokenCiphertext = await encryptSecret(input.tokens.accessToken);
  const refreshTokenCiphertext = input.tokens.refreshToken ? await encryptSecret(input.tokens.refreshToken) : null;
  const providerUserId = input.tokens.providerUserId ?? input.accounts[0]?.externalAccountId;
  if (!providerUserId) throw new Error("The provider did not return an account.");

  const { data: connection, error: connectionError } = await admin.from("social_connections").upsert({
    workspace_id: input.workspaceId,
    provider: input.provider,
    provider_user_id: providerUserId,
    provider_username: input.accounts[0]?.username ?? input.accounts[0]?.displayName,
    status: "active",
    scopes: input.tokens.scopes,
    access_token_ciphertext: accessTokenCiphertext,
    refresh_token_ciphertext: refreshTokenCiphertext,
    expires_at: input.tokens.expiresIn ? new Date(Date.now() + input.tokens.expiresIn * 1000).toISOString() : null,
    created_by: input.user.id,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "workspace_id,provider,provider_user_id" }).select("id").single();
  if (connectionError) throw connectionError;

  const accountRows = await Promise.all(input.accounts.map(async (account) => ({
    connection_id: connection.id,
    workspace_id: input.workspaceId,
    platform: account.platform,
    external_account_id: account.externalAccountId,
    display_name: account.displayName,
    username: account.username ?? null,
    avatar_url: account.avatarUrl ?? null,
    account_token_ciphertext: account.accountAccessToken ? await encryptSecret(account.accountAccessToken) : null,
    metadata: account.metadata ?? {},
    updated_at: new Date().toISOString(),
  })));
  const { error: accountError } = await admin.from("social_accounts").upsert(accountRows, { onConflict: "connection_id,platform,external_account_id" });
  if (accountError) throw accountError;
  return connection.id as string;
}

export async function listSocialConnections(userId: string) {
  const workspaceId = await getDefaultWorkspaceId(userId);
  if (!workspaceId) return { workspaceId: null, connections: [] };
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("social_connections").select("id,provider,status,scopes,expires_at,connected_at,social_accounts(id,platform,display_name,username,avatar_url)").eq("workspace_id", workspaceId).order("connected_at", { ascending: false });
  if (error) throw error;
  return { workspaceId, connections: data };
}
