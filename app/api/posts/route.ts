import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { postInputSchema } from "@/lib/post-schema";
import { createPost } from "@/lib/posts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const parsed = postInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid post." }, { status: 400 });
    const result = await createPost(user, parsed.data);
    const responseStatus = result.status === "failed" ? 502 : result.status === "partially_failed" ? 207 : 201;
    return NextResponse.json(result, { status: responseStatus });
  } catch (error) {
    console.error("Post creation failed", getErrorMessage(error));
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
