import { z } from "zod";

export const MAX_CONTENT_CHARS = 1_000_000;

export const titleSchema = z.string().trim().min(1, "Title can't be empty").max(200, "Title is too long");

export const createDocSchema = z.object({ title: titleSchema.optional() });

export const updateDocSchema = z
  .object({
    title: titleSchema.optional(),
    content: z.string().max(MAX_CONTENT_CHARS, "Document is too large").optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, "Nothing to update");

export const shareSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["viewer", "editor"]),
});

export const revokeSchema = z.object({ userId: z.string().min(1) });

export const loginSchema = z.object({ userId: z.string().min(1) });
