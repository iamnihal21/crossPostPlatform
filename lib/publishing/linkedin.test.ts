import assert from "node:assert/strict";
import test from "node:test";
import { publishLinkedInTextPost } from "./linkedin.ts";

test("publishes a member text post with the required LinkedIn headers", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response("", { status: 201, headers: { "x-restli-id": "urn:li:share:123" } });
  };

  try {
    const result = await publishLinkedInTextPost({ accessToken: "test-token", personId: "member-123", content: "Hello LinkedIn" });
    assert.equal(capturedUrl, "https://api.linkedin.com/rest/posts");
    assert.equal(new Headers(capturedInit?.headers).get("Authorization"), "Bearer test-token");
    assert.equal(new Headers(capturedInit?.headers).get("X-Restli-Protocol-Version"), "2.0.0");
    const body = JSON.parse(String(capturedInit?.body)) as { author: string; commentary: string };
    assert.equal(body.author, "urn:li:person:member-123");
    assert.equal(body.commentary, "Hello LinkedIn");
    assert.equal(result.providerPostId, "urn:li:share:123");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
