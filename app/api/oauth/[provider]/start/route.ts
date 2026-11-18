import { NextRequest, NextResponse } from "next/server";
import { getServerEnvironment } from "@/lib/env";
import { getDefaultWorkspaceId } from "@/lib/social/connections";
import { createAuthorizationRequest, encodeOAuthSession } from "@/lib/social/oauth";
import { isSocialProvider } from "@/lib/social/providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const fallback = new URL("/accounts", request.url);
  if (!isSocialProvider(provider)) return NextResponse.redirect(new URL("/accounts?error=unknown_provider", request.url));

  try {
    const environment = getServerEnvironment();
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/login?next=/accounts", request.url));

    const workspaceId = request.nextUrl.searchParams.get("workspace_id") ?? await getDefaultWorkspaceId(user.id);
    if (!workspaceId) return NextResponse.redirect(new URL("/accounts?error=workspace_required", request.url));
    const redirectUri = `${environment.NEXT_PUBLIC_APP_URL}/api/oauth/${provider}/callback`;
    const { authorizationUrl, session } = await createAuthorizationRequest(provider, redirectUri, workspaceId);
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(`postlane_oauth_${provider}`, encodeOAuthSession(session), {
      httpOnly: true,
      secure: environment.NEXT_PUBLIC_APP_URL.startsWith("https://"),
      sameSite: "lax",
      path: `/api/oauth/${provider}`,
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    console.error("OAuth start failed", { provider, error: error instanceof Error ? error.message : "Unknown error" });
    fallback.searchParams.set("error", "provider_not_configured");
    fallback.searchParams.set("provider", provider);
    return NextResponse.redirect(fallback);
  }
}
