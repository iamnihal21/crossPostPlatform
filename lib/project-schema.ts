import { z } from "zod";

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(100),
  description: z.string().trim().max(500).default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid project color."),
  timezone: z.string().trim().min(1).max(100),
  socialAccountIds: z.array(z.uuid()).max(50).default([]),
  status: z.enum(["active", "archived"]).optional(),
});
