import { z } from "zod";
import type { SubmissionFormField } from "@/lib/track-submissions/types";
import { normalizeSubmissionFields } from "@/lib/track-submissions/fields";
import { isDriveFolderUrl } from "@/lib/track-submissions/drive-url";

const githubUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .refine(
    (value) => {
      try {
        const host = new URL(value).hostname.toLowerCase();
        return (
          host === "github.com" ||
          host === "www.github.com" ||
          host === "raw.githubusercontent.com"
        );
      } catch {
        return false;
      }
    },
    "Link must point to github.com",
  );

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    "Enter a valid URL",
  );

const driveFolderUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid Google Drive folder link")
  .refine(isDriveFolderUrl, "Link must be a Google Drive folder URL");

const submissionFieldSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    type: z.enum(["text", "textarea", "url", "file"]),
    label: z.string().trim().min(1, "Label is required").max(160),
    hint: z.string().trim().max(500).optional(),
    required: z.boolean(),
    githubOnly: z.boolean().optional(),
    accept: z.string().trim().max(120).optional(),
    driveFolderUrl: z.string().trim().max(500).optional(),
  })
  .superRefine((field, ctx) => {
    if (field.type !== "file") return;
    const url = field.driveFolderUrl?.trim() ?? "";
    if (!url) {
      ctx.addIssue({
        code: "custom",
        message: "Google Drive folder link is required for file fields",
        path: ["driveFolderUrl"],
      });
      return;
    }
    const parsed = driveFolderUrlSchema.safeParse(url);
    if (!parsed.success) {
      ctx.addIssue({
        code: "custom",
        message:
          parsed.error.issues[0]?.message ??
          "Enter a valid Google Drive folder link",
        path: ["driveFolderUrl"],
      });
    }
  });

/** Track admin — create or update a week submission form. */
export const trackSubmissionWeekAdminInput = z.object({
  trackSlug: z.string().min(1),
  week: z.number().int().min(1).max(52),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  instructionsUrl: optionalUrl.optional(),
  fields: z
    .array(submissionFieldSchema)
    .min(1, "Add at least one form field")
    .max(20),
  isOpen: z.boolean(),
});

export type TrackSubmissionWeekAdminInput = z.infer<
  typeof trackSubmissionWeekAdminInput
>;

export function validateSubmissionResponses(
  fields: SubmissionFormField[],
  responses: Record<string, string>,
): { ok: true } | { ok: false; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const raw = responses[field.id]?.trim() ?? "";

    if (field.type === "file") {
      if (field.required && !raw) {
        fieldErrors[field.id] = "Upload a file.";
      }
      continue;
    }

    if (field.required && !raw) {
      fieldErrors[field.id] = "This field is required.";
      continue;
    }

    if (!raw) continue;

    if (field.type === "url") {
      const schema = field.githubOnly ? githubUrl : z.string().url("Enter a valid URL");
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        fieldErrors[field.id] = parsed.error.issues[0]?.message ?? "Invalid URL.";
      }
      continue;
    }

    if (raw.length > (field.type === "textarea" ? 5000 : 500)) {
      fieldErrors[field.id] = "Too long.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }
  return { ok: true };
}

export function parseAdminSubmissionFields(raw: unknown): SubmissionFormField[] {
  return normalizeSubmissionFields(raw);
}

/** @deprecated Legacy shape — use FormData submitTrackWeekForm */
export const trackWeekSubmissionInput = z.object({
  trackSlug: z.string().min(1),
  week: z.number().int().min(1),
  part1GithubUrl: githubUrl,
  part2GithubUrl: githubUrl,
});

export type TrackWeekSubmissionInput = z.infer<typeof trackWeekSubmissionInput>;

export const mlAstronomyWeek1SubmissionInput = trackWeekSubmissionInput.extend({
  trackSlug: z.literal("ml-astronomy"),
  week: z.literal(1),
});

export type MlAstronomyWeek1SubmissionInput = z.infer<
  typeof mlAstronomyWeek1SubmissionInput
>;
