import assert from "node:assert/strict";
import test from "node:test";
import { createYouTubeResumableUpload, getYouTubeVideo } from "./youtube.ts";

test("starts a resumable YouTube upload without exposing the token in the URL", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(null, { status: 200, headers: { location: "https://upload.youtube.test/session" } });
  };
  try {
    const uploadUrl = await createYouTubeResumableUpload({ accessToken: "secret-token", title: "Demo", description: "Description", privacy: "private", mimeType: "video/mp4", fileSize: 1234 });
    assert.equal(uploadUrl, "https://upload.youtube.test/session");
    assert.match(capturedUrl, /uploadType=resumable/);
    assert.equal(capturedUrl.includes("secret-token"), false);
    assert.equal(new Headers(capturedInit?.headers).get("Authorization"), "Bearer secret-token");
    assert.equal(new Headers(capturedInit?.headers).get("X-Upload-Content-Length"), "1234");
    const body = JSON.parse(String(capturedInit?.body)) as { status: { privacyStatus: string } };
    assert.equal(body.status.privacyStatus, "private");
  } finally { globalThis.fetch = originalFetch; }
});

test("loads an uploaded video for channel ownership verification", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ items: [{ id: "video-1", snippet: { channelId: "channel-1" }, status: { uploadStatus: "uploaded" } }] });
  try {
    const video = await getYouTubeVideo({ accessToken: "token", videoId: "video-1" });
    assert.equal(video.snippet?.channelId, "channel-1");
  } finally { globalThis.fetch = originalFetch; }
});
