import assert from "node:assert/strict";
import test from "node:test";
import { postInputSchema } from "./post-schema.ts";

const validPost = {
  projectId: "2d6e0d2f-5f62-4df4-a476-71aa435aa001",
  content: "A production test post",
  socialAccountIds: ["62361a86-d1a3-4c36-96c9-87342185aa02"],
  action: "publish" as const,
};

test("accepts a valid immediate post", () => {
  assert.equal(postInputSchema.safeParse(validPost).success, true);
});

test("rejects an empty post and missing targets", () => {
  const result = postInputSchema.safeParse({ ...validPost, content: "", socialAccountIds: [] });
  assert.equal(result.success, false);
});
