import { NextRequest, NextResponse } from "next/server";
import { getServerEnvironment } from "@/lib/env";
import { assertWorkspaceMembership, saveSocialConnection } from "@/lib/social/connections";
import { discoverSocialAccounts } from "@/lib/social/discovery";
import { decodeOAuthSession, exchangeAuthorizationCode } from "@/lib/social/oauth";
import { isSocialProvider } from "@/lib/social/providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const destination = new URL("/accounts", request.url);
  if (!isSocialProvider(provider)) return NextResponse.redirect(new URL("/accounts?error=unknown_provider", request.url));

  const cookieName = `postlane_oauth_${provider}`;
  try {
    const providerError = request.nextUrl.searchParams.get("error");
    if (providerError) throw new Error(`Provider authorization failed: ${providerError}`);
    const code = request.nextUrl.searchParams.get("code");
    const returnedState = request.nextUrl.searchParams.get("state");
    const session = decodeOAuthSession(request.cookies.get(cookieName)?.value);
    if (!code || !returnedState || !session || session.state !== returnedState) throw new Error("OAuth state validation failed.");

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication is required.");
    await assertWorkspaceMembership(user.id, session.workspaceId);

    const environment = getServerEnvironment();
    const redirectUri = `${environment.NEXT_PUBLIC_APP_URL}/api/oauth/${provider}/callback`;
    const tokens = await exchangeAuthorizationCode(provider, code, redirectUri, session.codeVerifier);
    const accounts = await discoverSocialAccounts(provider, tokens.accessToken);
    await saveSocialConnection({ user, workspaceId: session.workspaceId, provider, tokens, accounts });
    destination.searchParams.set("connected", provider);
  } catch (error) {
    console.error("OAuth callback failed", { provider, error: error instanceof Error ? error.message : "Unknown error" });
    destination.searchParams.set("error", "connection_failed");
    destination.searchParams.set("provider", provider);
  }

  const response = NextResponse.redirect(destination);
  response.cookies.delete(cookieName);
  return response;
}
