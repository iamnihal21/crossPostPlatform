import { z } from "zod";

const supportedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"] as const;

export const youtubeUploadInitSchema = z.object({
  projectId: z.uuid(),
  socialAccountId: z.uuid(),
  title: z.string().trim().min(1, "Video title is required.").max(100),
  description: z.string().trim().max(5000).default(""),
  privacy: z.enum(["private", "unlisted", "public"]).default("private"),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(supportedVideoTypes),
  fileSize: z.number().int().positive().max(2 * 1024 * 1024 * 1024, "Video files are limited to 2 GB in Postlane."),
});

export const youtubeUploadCompleteSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("completed"), videoId: z.string().trim().min(1).max(100) }),
  z.object({ status: z.literal("failed"), error: z.string().trim().min(1).max(1000) }),
]);
