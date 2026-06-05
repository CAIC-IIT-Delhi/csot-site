import { z } from "zod";
import { trackSlugs } from "@/lib/tracks";
import { HOSTELS } from "@/lib/hostels";

/**
 * Asked once during onboarding. Stored on csot_users and reused for every
 * subsequent track registration.
 */
/** Valid entry years for CSoT'26 — current enrolled IITD students. */
export const ENTRY_YEARS = [2021, 2022, 2023, 2024, 2025] as const;
export type EntryYear = (typeof ENTRY_YEARS)[number];

export const onboardingInput = z.object({
  hostel: z.enum(HOSTELS, { message: "Pick your hostel from the list" }),
  entryYear: z
    .number({ message: "Pick your entry year" })
    .int()
    .refine((v) => (ENTRY_YEARS as readonly number[]).includes(v), {
      message: "Pick a valid entry year (2021–2025)",
    }),
  phone: z
    .string()
    .trim()
    .regex(
      /^[+]?[0-9 ()-]{7,18}$/,
      "Enter a valid phone number (digits, spaces, +, -, ())",
    ),
});

export type OnboardingInput = z.infer<typeof onboardingInput>;

/**
 * Asked per track. Hostel / year / phone come from the user profile.
 */
export const registrationInput = z.object({
  trackSlug: z.enum(trackSlugs() as [string, ...string[]]),
  pastExperience: z
    .string()
    .trim()
    .min(10, "Tell us a little more, even one or two lines is fine")
    .max(1500, "Please keep this under 1500 characters"),
  whyTrack: z
    .string()
    .trim()
    .min(10, "Tell us a little more, even one or two lines is fine")
    .max(1500, "Please keep this under 1500 characters"),
  commitmentHours: z
    .number({ message: "Enter how many hours per week you can commit" })
    .int()
    .min(1, "Must be between 1 and 40")
    .max(40, "Must be between 1 and 40"),
});

export type RegistrationInput = z.infer<typeof registrationInput>;

const leaderboardEditorRow = z.object({
  rank: z
    .number({ message: "Rank must be a number" })
    .int()
    .min(1, "Rank must be at least 1"),
  entryNumber: z
    .string()
    .trim()
    .min(1, "Entry number is required")
    .max(32, "Entry number is too long"),
  points: z
    .number({ message: "Points must be a number" })
    .finite()
    .nullable()
    .optional(),
});

export const leaderboardEditorSaveInput = z
  .object({
    trackSlug: z.string().min(1),
    usesPoints: z.boolean(),
    rows: z.array(leaderboardEditorRow).max(500),
  })
  .superRefine((data, ctx) => {
    const entries = new Set<string>();
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      const key = row.entryNumber.trim().toUpperCase();
      if (entries.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate entry number ${key}`,
          path: ["rows", i, "entryNumber"],
        });
      }
      entries.add(key);
    }
  });

export type LeaderboardEditorSaveInput = z.infer<
  typeof leaderboardEditorSaveInput
>;

export {
  trackSubmissionWeekAdminInput,
  trackWeekSubmissionInput,
  mlAstronomyWeek1SubmissionInput,
  validateSubmissionResponses,
  parseAdminSubmissionFields,
  type TrackSubmissionWeekAdminInput,
  type TrackWeekSubmissionInput,
  type MlAstronomyWeek1SubmissionInput,
} from "@/lib/track-submissions/validate";
