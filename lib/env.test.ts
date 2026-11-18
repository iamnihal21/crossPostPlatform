import assert from "node:assert/strict";
import test from "node:test";
import { getServerEnvironment } from "./env.ts";

test("blank credentials for unused providers are treated as unconfigured", () => {
  const originalEnvironment = { ...process.env };
  Object.assign(process.env, {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
    TOKEN_ENCRYPTION_KEY: "encryption-key",
    GOOGLE_CLIENT_ID: "google-client-id",
    GOOGLE_CLIENT_SECRET: "google-client-secret",
    X_CLIENT_ID: "",
    X_CLIENT_SECRET: "",
    LINKEDIN_CLIENT_ID: "",
    LINKEDIN_CLIENT_SECRET: "",
    META_CLIENT_ID: "",
    META_CLIENT_SECRET: "",
    THREADS_CLIENT_ID: "",
    THREADS_CLIENT_SECRET: "",
  });

  try {
    const environment = getServerEnvironment();
    assert.equal(environment.GOOGLE_CLIENT_ID, "google-client-id");
    assert.equal(environment.X_CLIENT_ID, undefined);
    assert.equal(environment.LINKEDIN_CLIENT_ID, undefined);
    assert.equal(environment.META_CLIENT_ID, undefined);
    assert.equal(environment.THREADS_CLIENT_ID, undefined);
  } finally {
    process.env = originalEnvironment;
  }
});
