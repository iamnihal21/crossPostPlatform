import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { youtubeUploadInitSchema } from "@/lib/youtube-schema";
import { startYouTubeUpload } from "@/lib/youtube-uploads";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const parsed = youtubeUploadInitSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid upload." }, { status: 400 });
    return NextResponse.json(await startYouTubeUpload(user, parsed.data), { status: 201 });
  } catch (error) {
    console.error("YouTube upload initialization failed", getErrorMessage(error));
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
