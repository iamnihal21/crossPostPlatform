import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureDefaultWorkspace } from "@/lib/social/connections";

export type ProjectStatus = "active" | "archived";
export type ProjectInput = {
  name: string;
  description: string;
  color: string;
  timezone: string;
  socialAccountIds: string[];
};

function createProjectSlug(name: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "project";
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function listProjectsForUser(user: User) {
  const workspaceId = await ensureDefaultWorkspace(user);
  const admin = createSupabaseAdminClient();
  const [{ data: projects, error: projectError }, { data: accounts, error: accountError }] = await Promise.all([
    admin.from("projects").select("id,name,slug,description,color,timezone,status,created_at,project_social_accounts(social_account_id)").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    admin.from("social_accounts").select("id,platform,display_name,username,avatar_url").eq("workspace_id", workspaceId).order("display_name"),
  ]);
  if (projectError) throw projectError;
  if (accountError) throw accountError;
  return { workspaceId, projects: projects ?? [], accounts: accounts ?? [] };
}

async function validateAccountIds(workspaceId: string, accountIds: string[]) {
  const uniqueIds = [...new Set(accountIds)];
  if (!uniqueIds.length) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("social_accounts").select("id").eq("workspace_id", workspaceId).in("id", uniqueIds);
  if (error) throw error;
  if ((data ?? []).length !== uniqueIds.length) throw new Error("One or more selected accounts do not belong to this workspace.");
  return uniqueIds;
}

export async function createProject(user: User, input: ProjectInput) {
  const workspaceId = await ensureDefaultWorkspace(user);
  const accountIds = await validateAccountIds(workspaceId, input.socialAccountIds);
  const admin = createSupabaseAdminClient();
  const { data: project, error } = await admin.from("projects").insert({
    workspace_id: workspaceId,
    name: input.name,
    slug: createProjectSlug(input.name),
    description: input.description,
    color: input.color,
    timezone: input.timezone,
    created_by: user.id,
  }).select("id").single();
  if (error) throw error;
  if (accountIds.length) {
    const { error: mappingError } = await admin.from("project_social_accounts").insert(accountIds.map((socialAccountId) => ({ project_id: project.id, social_account_id: socialAccountId })));
    if (mappingError) throw mappingError;
  }
  return project.id as string;
}

export async function updateProject(user: User, projectId: string, input: ProjectInput & { status?: ProjectStatus }) {
  const workspaceId = await ensureDefaultWorkspace(user);
  const accountIds = await validateAccountIds(workspaceId, input.socialAccountIds);
  const admin = createSupabaseAdminClient();
  const { data: project, error } = await admin.from("projects").update({
    name: input.name,
    description: input.description,
    color: input.color,
    timezone: input.timezone,
    status: input.status ?? "active",
    updated_at: new Date().toISOString(),
  }).eq("id", projectId).eq("workspace_id", workspaceId).select("id").maybeSingle();
  if (error) throw error;
  if (!project) throw new Error("Project not found.");
  const { error: deleteError } = await admin.from("project_social_accounts").delete().eq("project_id", projectId);
  if (deleteError) throw deleteError;
  if (accountIds.length) {
    const { error: mappingError } = await admin.from("project_social_accounts").insert(accountIds.map((socialAccountId) => ({ project_id: projectId, social_account_id: socialAccountId })));
    if (mappingError) throw mappingError;
  }
}
