import { NextRequest, NextResponse } from "next/server";
import { assertWorkspaceMembership } from "@/lib/social/connections";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(_request: NextRequest, context: { params: Promise<{ connectionId: string }> }) {
  const { connectionId } = await context.params;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: connection, error } = await admin.from("social_connections").select("workspace_id").eq("id", connectionId).maybeSingle();
    if (error || !connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    await assertWorkspaceMembership(user.id, connection.workspace_id as string);
    const { error: deleteError } = await admin.from("social_connections").delete().eq("id", connectionId);
    if (deleteError) throw deleteError;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Social connection removal failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not remove the connection" }, { status: 500 });
  }
}
