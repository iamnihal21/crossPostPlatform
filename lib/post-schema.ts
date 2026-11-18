import { z } from "zod";

export const postInputSchema = z.object({
  projectId: z.uuid(),
  content: z.string().trim().min(1, "Write something before saving the post.").max(3000, "LinkedIn posts can contain at most 3,000 characters."),
  socialAccountIds: z.array(z.uuid()).min(1, "Select at least one account.").max(20),
  action: z.enum(["draft", "publish"]),
});
