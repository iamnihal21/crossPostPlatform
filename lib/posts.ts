import type { User } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/errors";
import type { z } from "zod";
import { postInputSchema } from "@/lib/post-schema";
import { publishLinkedInTextPost } from "@/lib/publishing/linkedin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureDefaultWorkspace } from "@/lib/social/connections";
import { decryptSecret } from "@/lib/social/crypto";

export type PostInput = z.infer<typeof postInputSchema>;
export type ComposerAccount = { id: string; platform: string; displayName: string; username: string | null };
export type ComposerProject = { id: string; name: string; color: string; accounts: ComposerAccount[] };

export async function getComposerProjects(user: User): Promise<ComposerProject[]> {
  const workspaceId = await ensureDefaultWorkspace(user);
  const admin = createSupabaseAdminClient();
  const { data: projects, error: projectError } = await admin.from("projects").select("id,name,color").eq("workspace_id", workspaceId).eq("status", "active").order("name");
  if (projectError) throw projectError;
  const projectIds = (projects ?? []).map((project) => project.id as string);
  if (!projectIds.length) return [];
  const { data: mappings, error: mappingError } = await admin.from("project_social_accounts").select("project_id,social_account_id,social_accounts(id,platform,display_name,username)").in("project_id", projectIds);
  if (mappingError) throw mappingError;

  return (projects ?? []).map((project) => ({
    id: project.id as string,
    name: project.name as string,
    color: project.color as string,
    accounts: (mappings ?? []).filter((mapping) => mapping.project_id === project.id).flatMap((mapping) => {
      const account = mapping.social_accounts as unknown as { id: string; platform: string; display_name: string; username: string | null } | null;
      return account ? [{ id: account.id, platform: account.platform, displayName: account.display_name, username: account.username }] : [];
    }),
  }));
}

async function publishTarget(targetId: string, socialAccountId: string, content: string) {
  const admin = createSupabaseAdminClient();
  await admin.from("post_targets").update({ status: "publishing", updated_at: new Date().toISOString() }).eq("id", targetId);
  const { data: account, error } = await admin.from("social_accounts").select("id,platform,external_account_id,connection_id,social_connections!inner(status,access_token_ciphertext,expires_at)").eq("id", socialAccountId).single();
  if (error) throw error;
  const connection = account.social_connections as unknown as { status: string; access_token_ciphertext: string; expires_at: string | null };
  if (connection.status !== "active") throw new Error("This social connection must be reconnected before publishing.");
  if (connection.expires_at && new Date(connection.expires_at).getTime() <= Date.now()) throw new Error("The access token has expired. Reconnect the account and try again.");
  const accessToken = await decryptSecret(connection.access_token_ciphertext);

  if (account.platform !== "linkedin") throw new Error(`${account.platform} publishing is not available in this component yet.`);
  return publishLinkedInTextPost({ accessToken, personId: account.external_account_id as string, content });
}

export async function createPost(user: User, input: PostInput) {
  const workspaceId = await ensureDefaultWorkspace(user);
  const admin = createSupabaseAdminClient();
  const { data: project, error: projectError } = await admin.from("projects").select("id").eq("id", input.projectId).eq("workspace_id", workspaceId).eq("status", "active").maybeSingle();
  if (projectError) throw projectError;
  if (!project) throw new Error("Project not found or archived.");

  const uniqueAccountIds = [...new Set(input.socialAccountIds)];
  const { data: mappings, error: mappingError } = await admin.from("project_social_accounts").select("social_account_id,social_accounts!inner(id,platform)").eq("project_id", input.projectId).in("social_account_id", uniqueAccountIds);
  if (mappingError) throw mappingError;
  if ((mappings ?? []).length !== uniqueAccountIds.length) throw new Error("Every selected account must be assigned to this project.");
  if (input.action === "publish" && mappings?.some((mapping) => (mapping.social_accounts as unknown as { platform: string }).platform !== "linkedin")) throw new Error("Immediate publishing currently supports LinkedIn text posts only.");

  const { data: post, error: postError } = await admin.from("posts").insert({
    workspace_id: workspaceId,
    project_id: input.projectId,
    content: input.content,
    status: input.action === "draft" ? "draft" : "publishing",
    created_by: user.id,
  }).select("id").single();
  if (postError) throw postError;

  const targetRows = (mappings ?? []).map((mapping) => ({
    post_id: post.id,
    social_account_id: mapping.social_account_id,
    platform: (mapping.social_accounts as unknown as { platform: string }).platform,
    status: "pending",
  }));
  const { data: targets, error: targetError } = await admin.from("post_targets").insert(targetRows).select("id,social_account_id");
  if (targetError) throw targetError;
  if (input.action === "draft") return { postId: post.id as string, status: "draft" as const, results: [] };

  const results = [] as { targetId: string; ok: boolean; error?: string }[];
  for (const target of targets ?? []) {
    try {
      const result = await publishTarget(target.id as string, target.social_account_id as string, input.content);
      const publishedAt = new Date().toISOString();
      await admin.from("post_targets").update({ status: "published", provider_post_id: result.providerPostId, published_at: publishedAt, error_message: null, updated_at: publishedAt }).eq("id", target.id);
      results.push({ targetId: target.id as string, ok: true });
    } catch (error) {
      const message = getErrorMessage(error).slice(0, 1000);
      await admin.from("post_targets").update({ status: "failed", error_message: message, updated_at: new Date().toISOString() }).eq("id", target.id);
      results.push({ targetId: target.id as string, ok: false, error: message });
    }
  }

  const succeeded = results.filter((result) => result.ok).length;
  const status = succeeded === results.length ? "published" : succeeded === 0 ? "failed" : "partially_failed";
  const now = new Date().toISOString();
  await admin.from("posts").update({ status, published_at: succeeded ? now : null, updated_at: now }).eq("id", post.id);
  return { postId: post.id as string, status, results };
}
