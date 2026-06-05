"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabase } from "@/lib/supabase/server";
import { getTrack } from "@/lib/tracks";
import { getSubmissionWeekConfig } from "@/lib/track-submissions/weeks";
import { submissionWeekPath } from "@/lib/track-submissions/paths";
import type { SubmissionResponses } from "@/lib/track-submissions/types";
import { validateSubmissionResponses } from "@/lib/validations";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireRegisteredForTrack(
  userId: string,
  trackSlug: string,
): Promise<ActionResult | null> {
  const supabase = getSupabase();
  const { data: registration } = await supabase
    .from("csot_registrations")
    .select("id")
    .eq("user_id", userId)
    .eq("track_slug", trackSlug)
    .maybeSingle();

  if (!registration) {
    return {
      ok: false,
      error: "You must register for this track before submitting.",
    };
  }

  return null;
}

function responsesFromFormData(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("field_")) continue;
    if (typeof value === "string") {
      out[key.slice("field_".length)] = value;
    }
  }
  return out;
}

function isDriveFileUrl(url: string): boolean {
  return (
    url.includes("drive.google.com/file/") ||
    url.includes("docs.google.com/")
  );
}

export async function submitTrackWeekForm(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to submit your project." };
  }

  const trackSlug = String(formData.get("trackSlug") ?? "").trim();
  const week = Number.parseInt(String(formData.get("week") ?? ""), 10);

  if (!trackSlug || !Number.isFinite(week) || week < 1) {
    return { ok: false, error: "Invalid submission." };
  }

  const track = getTrack(trackSlug);
  if (!track || track.status !== "open") {
    return { ok: false, error: "Submissions are not open for this track." };
  }

  const weekConfig = await getSubmissionWeekConfig(trackSlug, week);
  if (!weekConfig || !weekConfig.isOpen) {
    return { ok: false, error: "This week's submission form is not available." };
  }

  const registrationError = await requireRegisteredForTrack(
    session.user.id,
    trackSlug,
  );
  if (registrationError) return registrationError;

  const allResponses = responsesFromFormData(formData);
  const textFields = weekConfig.fields.filter((f) => f.type !== "file");
  const validation = validateSubmissionResponses(textFields, allResponses);
  if (!validation.ok) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const responses: SubmissionResponses = {};
  const fieldErrors: Record<string, string> = {};

  for (const field of weekConfig.fields) {
    const raw = allResponses[field.id]?.trim() ?? "";

    if (field.type === "file") {
      if (!raw) {
        if (field.required) {
          fieldErrors[field.id] = "Upload a file.";
        }
        continue;
      }
      if (!isDriveFileUrl(raw)) {
        fieldErrors[field.id] = "Invalid Drive file link.";
        continue;
      }
      responses[field.id] = raw;
      continue;
    }

    if (raw) responses[field.id] = raw;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("csot_track_submissions").upsert(
    {
      user_id: session.user.id,
      track_slug: trackSlug,
      week,
      responses,
    },
    { onConflict: "user_id,track_slug,week" },
  );

  if (error) {
    console.error("csot_track_submissions upsert failed", error);
    return {
      ok: false,
      error: "We could not save your submission. Please try again.",
    };
  }

  revalidatePath(submissionWeekPath(trackSlug, week));
  revalidatePath(`/tracks/${trackSlug}/register`);
  revalidatePath(`/tracks/${trackSlug}/admin`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/** @deprecated Use submitTrackWeekForm */
export async function submitTrackWeek(raw: {
  trackSlug: string;
  week: number;
  part1GithubUrl: string;
  part2GithubUrl: string;
}): Promise<ActionResult> {
  const fd = new FormData();
  fd.set("trackSlug", raw.trackSlug);
  fd.set("week", String(raw.week));
  fd.set("field_part1", raw.part1GithubUrl);
  fd.set("field_part2", raw.part2GithubUrl);
  return submitTrackWeekForm(fd);
}

export async function submitMlAstronomyWeek1(raw: {
  trackSlug: "ml-astronomy";
  week: 1;
  part1GithubUrl: string;
  part2GithubUrl: string;
}): Promise<ActionResult> {
  return submitTrackWeek(raw);
}
