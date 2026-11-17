import { z } from "zod";

const serverEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z.string().min(1),
  X_CLIENT_ID: z.string().min(1).optional(),
  X_CLIENT_SECRET: z.string().min(1).optional(),
  LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
  LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),
  META_CLIENT_ID: z.string().min(1).optional(),
  META_CLIENT_SECRET: z.string().min(1).optional(),
  META_GRAPH_VERSION: z.string().regex(/^v\d+\.\d+$/).default("v24.0"),
  THREADS_CLIENT_ID: z.string().min(1).optional(),
  THREADS_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function getServerEnvironment(): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Server configuration is incomplete: ${fields}`);
  }
  return result.data;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
