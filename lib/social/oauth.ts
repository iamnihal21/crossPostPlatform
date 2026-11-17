import { createCodeChallenge, createRandomValue } from "@/lib/social/crypto";
import { getProviderCredentials, providerDefinitions, type SocialProviderId } from "@/lib/social/providers";

export type OAuthSession = { state: string; codeVerifier?: string; workspaceId: string; createdAt: number };
export type OAuthTokenSet = { accessToken: string; refreshToken?: string; expiresIn?: number; scopes: string[]; providerUserId?: string };

export function encodeOAuthSession(session: OAuthSession) {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function decodeOAuthSession(value?: string): OAuthSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as OAuthSession;
    if (!parsed.state || !parsed.workspaceId || Date.now() - parsed.createdAt > 10 * 60 * 1000) return null;
    return parsed;
  } catch { return null; }
}

export async function createAuthorizationRequest(provider: SocialProviderId, redirectUri: string, workspaceId: string) {
  const definition = providerDefinitions[provider];
  const { clientId } = getProviderCredentials(provider);
  const state = createRandomValue();
  const codeVerifier = definition.supportsPkce ? createRandomValue(64) : undefined;
  const authorizationUrl = new URL(definition.authorizationUrl);
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", definition.scopes.join(definition.scopeSeparator));
  authorizationUrl.searchParams.set("state", state);

  if (codeVerifier) {
    authorizationUrl.searchParams.set("code_challenge", await createCodeChallenge(codeVerifier));
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
  }
  if (provider === "google") {
    authorizationUrl.searchParams.set("access_type", "offline");
    authorizationUrl.searchParams.set("include_granted_scopes", "true");
    authorizationUrl.searchParams.set("prompt", "consent");
  }
  if (provider === "meta") {
    const graphVersion = process.env.META_GRAPH_VERSION ?? "v24.0";
    authorizationUrl.pathname = `/${graphVersion}/dialog/oauth`;
  }

  return { authorizationUrl, session: { state, codeVerifier, workspaceId, createdAt: Date.now() } satisfies OAuthSession };
}

export async function exchangeAuthorizationCode(provider: SocialProviderId, code: string, redirectUri: string, codeVerifier?: string): Promise<OAuthTokenSet> {
  const definition = providerDefinitions[provider];
  const { clientId, clientSecret } = getProviderCredentials(provider);
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId });
  const headers: HeadersInit = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };

  if (codeVerifier) body.set("code_verifier", codeVerifier);
  if (provider === "x") headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  else body.set("client_secret", clientSecret);

  const tokenUrl = new URL(definition.tokenUrl);
  if (provider === "meta") {
    const graphVersion = process.env.META_GRAPH_VERSION ?? "v24.0";
    tokenUrl.pathname = `/${graphVersion}/oauth/access_token`;
  }
  const response = await fetch(tokenUrl, { method: "POST", headers, body, cache: "no-store" });
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok || typeof payload.access_token !== "string") {
    const message = typeof payload.error_description === "string" ? payload.error_description : "The provider rejected the authorization code.";
    throw new Error(message);
  }

  return {
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === "string" ? payload.refresh_token : undefined,
    expiresIn: typeof payload.expires_in === "number" ? payload.expires_in : undefined,
    scopes: typeof payload.scope === "string" ? payload.scope.split(/[ ,]+/).filter(Boolean) : definition.scopes,
    providerUserId: typeof payload.user_id === "string" ? payload.user_id : undefined,
  };
}
