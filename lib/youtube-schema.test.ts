import assert from "node:assert/strict";
import test from "node:test";
import { youtubeUploadInitSchema } from "./youtube-schema.ts";

test("accepts a private MP4 YouTube upload", () => {
  const result = youtubeUploadInitSchema.safeParse({
    projectId: "2d6e0d2f-5f62-4df4-a476-71aa435aa001",
    socialAccountId: "62361a86-d1a3-4c36-96c9-87342185aa02",
    title: "Product demo",
    description: "A short product demo",
    privacy: "private",
    fileName: "demo.mp4",
    mimeType: "video/mp4",
    fileSize: 10_000_000,
  });
  assert.equal(result.success, true);
});

test("rejects an unsupported video type", () => {
  const result = youtubeUploadInitSchema.safeParse({
    projectId: "2d6e0d2f-5f62-4df4-a476-71aa435aa001",
    socialAccountId: "62361a86-d1a3-4c36-96c9-87342185aa02",
    title: "Product demo",
    description: "",
    privacy: "private",
    fileName: "demo.avi",
    mimeType: "video/x-msvideo",
    fileSize: 10_000_000,
  });
  assert.equal(result.success, false);
});
