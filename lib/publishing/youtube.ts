import { getProviderCredentials } from "../social/providers.ts";

export async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getProviderCredentials("google");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    cache: "no-store",
  });
  const payload = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description ?? "Google could not refresh the YouTube connection.");
  return { accessToken: payload.access_token, expiresIn: payload.expires_in ?? 3600 };
}

export async function createYouTubeResumableUpload(input: { accessToken: string; title: string; description: string; privacy: "private" | "unlisted" | "public"; mimeType: string; fileSize: number }) {
  const url = new URL("https://www.googleapis.com/upload/youtube/v3/videos");
  url.searchParams.set("uploadType", "resumable");
  url.searchParams.set("part", "snippet,status");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(input.fileSize),
      "X-Upload-Content-Type": input.mimeType,
    },
    body: JSON.stringify({
      snippet: { title: input.title, description: input.description, categoryId: "22" },
      status: { privacyStatus: input.privacy, selfDeclaredMadeForKids: false },
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message ?? `YouTube could not start the upload (${response.status}).`);
  }
  const uploadUrl = response.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube did not return a resumable upload URL.");
  return uploadUrl;
}

export async function getYouTubeVideo(input: { accessToken: string; videoId: string }) {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,status");
  url.searchParams.set("id", input.videoId);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${input.accessToken}` }, cache: "no-store" });
  const payload = await response.json() as { items?: { id: string; snippet?: { channelId?: string; title?: string }; status?: { privacyStatus?: string; uploadStatus?: string } }[]; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "YouTube could not verify the uploaded video.");
  const video = payload.items?.[0];
  if (!video) throw new Error("The uploaded YouTube video could not be found.");
  return video;
}
