import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { youtubeUploadCompleteSchema } from "@/lib/youtube-schema";
import { finishYouTubeUpload } from "@/lib/youtube-uploads";

export async function PATCH(request: NextRequest, context: { params: Promise<{ targetId: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const parsed = youtubeUploadCompleteSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid upload result." }, { status: 400 });
    const { targetId } = await context.params;
    return NextResponse.json(await finishYouTubeUpload(user, targetId, parsed.data));
  } catch (error) {
    console.error("YouTube upload completion failed", getErrorMessage(error));
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
