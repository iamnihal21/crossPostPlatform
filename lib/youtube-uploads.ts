import type { User } from "@supabase/supabase-js";
import type { z } from "zod";
import { getErrorMessage } from "@/lib/errors";
import { createYouTubeResumableUpload, getYouTubeVideo, refreshGoogleAccessToken } from "@/lib/publishing/youtube";
import { ensureDefaultWorkspace } from "@/lib/social/connections";
import { decryptSecret, encryptSecret } from "@/lib/social/crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { youtubeUploadCompleteSchema, youtubeUploadInitSchema } from "@/lib/youtube-schema";

type UploadInit = z.infer<typeof youtubeUploadInitSchema>;
type UploadCompletion = z.infer<typeof youtubeUploadCompleteSchema>;
type Connection = {
  id: string;
  status: string;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string | null;
  expires_at: string | null;
};

async function getValidGoogleAccessToken(connection: Connection) {
  if (connection.status !== "active") throw new Error("Reconnect this YouTube account before uploading.");
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : Number.POSITIVE_INFINITY;
  if (expiresAt > Date.now() + 60_000) return decryptSecret(connection.access_token_ciphertext);
  if (!connection.refresh_token_ciphertext) throw new Error("The YouTube session expired. Reconnect the account and try again.");

  const refreshed = await refreshGoogleAccessToken(await decryptSecret(connection.refresh_token_ciphertext));
  const now = new Date();
  const accessTokenCiphertext = await encryptSecret(refreshed.accessToken);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("social_connections").update({
    access_token_ciphertext: accessTokenCiphertext,
    expires_at: new Date(now.getTime() + refreshed.expiresIn * 1000).toISOString(),
    updated_at: now.toISOString(),
  }).eq("id", connection.id);
  if (error) throw error;
  return refreshed.accessToken;
}

async function loadConnection(connectionId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("social_connections")
    .select("id,status,access_token_ciphertext,refresh_token_ciphertext,expires_at")
    .eq("id", connectionId)
    .single();
  if (error) throw error;
  return data as Connection;
}

export async function startYouTubeUpload(user: User, input: UploadInit) {
  const workspaceId = await ensureDefaultWorkspace(user);
  const admin = createSupabaseAdminClient();
  const { data: project, error: projectError } = await admin.from("projects").select("id")
    .eq("id", input.projectId).eq("workspace_id", workspaceId).eq("status", "active").maybeSingle();
  if (projectError) throw projectError;
  if (!project) throw new Error("Project not found or archived.");

  const { data: mapping, error: mappingError } = await admin.from("project_social_accounts")
    .select("social_account_id").eq("project_id", input.projectId).eq("social_account_id", input.socialAccountId).maybeSingle();
  if (mappingError) throw mappingError;
  if (!mapping) throw new Error("The YouTube account must be assigned to this project.");

  const { data: account, error: accountError } = await admin.from("social_accounts")
    .select("id,connection_id,external_account_id,platform")
    .eq("id", input.socialAccountId).eq("workspace_id", workspaceId).eq("platform", "youtube").maybeSingle();
  if (accountError) throw accountError;
  if (!account) throw new Error("Connected YouTube account not found.");

  const { data: post, error: postError } = await admin.from("posts").insert({
    workspace_id: workspaceId,
    project_id: input.projectId,
    title: input.title,
    content: input.description,
    post_type: "video",
    status: "uploading",
    created_by: user.id,
    metadata: { privacy: input.privacy, file_name: input.fileName, mime_type: input.mimeType, file_size: input.fileSize },
  }).select("id").single();
  if (postError) throw postError;

  const { data: target, error: targetError } = await admin.from("post_targets").insert({
    post_id: post.id,
    social_account_id: account.id,
    platform: "youtube",
    status: "uploading",
  }).select("id").single();
  if (targetError) throw targetError;

  try {
    const accessToken = await getValidGoogleAccessToken(await loadConnection(account.connection_id as string));
    const uploadUrl = await createYouTubeResumableUpload({
      accessToken,
      title: input.title,
      description: input.description,
      privacy: input.privacy,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
    });
    return { postId: post.id as string, targetId: target.id as string, uploadUrl };
  } catch (error) {
    const message = getErrorMessage(error).slice(0, 1000);
    const now = new Date().toISOString();
    await admin.from("post_targets").update({ status: "failed", error_message: message, updated_at: now }).eq("id", target.id);
    await admin.from("posts").update({ status: "failed", updated_at: now }).eq("id", post.id);
    throw error;
  }
}

export async function finishYouTubeUpload(user: User, targetId: string, input: UploadCompletion) {
  const workspaceId = await ensureDefaultWorkspace(user);
  const admin = createSupabaseAdminClient();
  const { data: target, error: targetError } = await admin.from("post_targets")
    .select("id,post_id,social_account_id,status").eq("id", targetId).maybeSingle();
  if (targetError) throw targetError;
  if (!target) throw new Error("Upload target not found.");
  const { data: post, error: postError } = await admin.from("posts").select("id")
    .eq("id", target.post_id).eq("workspace_id", workspaceId).maybeSingle();
  if (postError) throw postError;
  if (!post) throw new Error("You do not have access to this upload.");
  const { data: account, error: accountError } = await admin.from("social_accounts")
    .select("id,connection_id,external_account_id,platform").eq("id", target.social_account_id)
    .eq("workspace_id", workspaceId).eq("platform", "youtube").maybeSingle();
  if (accountError) throw accountError;
  if (!account) throw new Error("Connected YouTube account not found.");

  const now = new Date().toISOString();
  if (input.status === "failed") {
    await admin.from("post_targets").update({ status: "failed", error_message: input.error, updated_at: now }).eq("id", targetId);
    await admin.from("posts").update({ status: "failed", updated_at: now }).eq("id", post.id);
    return { status: "failed" as const };
  }

  const accessToken = await getValidGoogleAccessToken(await loadConnection(account.connection_id as string));
  const video = await getYouTubeVideo({ accessToken, videoId: input.videoId });
  if (video.snippet?.channelId !== account.external_account_id) throw new Error("The uploaded video does not belong to the selected YouTube channel.");
  await admin.from("post_targets").update({
    status: "published",
    provider_post_id: video.id,
    error_message: null,
    metadata: { privacy: video.status?.privacyStatus, upload_status: video.status?.uploadStatus },
    published_at: now,
    updated_at: now,
  }).eq("id", targetId);
  await admin.from("posts").update({ status: "published", published_at: now, updated_at: now }).eq("id", post.id);
  return { status: "published" as const, videoId: video.id };
}
