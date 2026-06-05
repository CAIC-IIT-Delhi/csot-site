"use server";

import { revalidatePath } from "next/cache";
import {
  isEditableLeaderboardSlug,
  type EditableLeaderboardSlug,
} from "@/lib/leaderboard-editor/credentials";
import { assertEditorSession } from "@/lib/leaderboard-editor/session";
import { submissionWeekPath } from "@/lib/track-submissions/paths";
import { getSupabase } from "@/lib/supabase/server";
import { trackHasGoogleDriveConnected } from "@/app/actions/google-drive";
import { trackSubmissionWeekAdminInput } from "@/lib/validations";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function slugOrError(slug: string): EditableLeaderboardSlug | null {
  return isEditableLeaderboardSlug(slug) ? slug : null;
}

function revalidateSubmissionPaths(trackSlug: string, week: number) {
  revalidatePath(`/tracks/${trackSlug}/admin`);
  revalidatePath(submissionWeekPath(trackSlug, week));
  revalidatePath(`/tracks/${trackSlug}/register`);
  revalidatePath("/dashboard");
}

export async function saveTrackSubmissionWeek(raw: {
  trackSlug: string;
  week: number;
  title: string;
  description?: string;
  instructionsUrl?: string;
  fields: {
    id: string;
    type: "text" | "textarea" | "url" | "file";
    label: string;
    hint?: string;
    required: boolean;
    githubOnly?: boolean;
    accept?: string;
    driveFolderUrl?: string;
  }[];
  isOpen: boolean;
}): Promise<ActionResult> {
  const valid = slugOrError(raw.trackSlug);
  if (!valid) {
    return { ok: false, error: "This track does not have an admin portal." };
  }
  if (!(await assertEditorSession(valid))) {
    return { ok: false, error: "Not signed in." };
  }

  const parsed = trackSubmissionWeekAdminInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      fieldErrors,
    };
  }

  const data = parsed.data;

  const hasFileFields = data.fields.some((f) => f.type === "file");
  if (hasFileFields && !(await trackHasGoogleDriveConnected(valid))) {
    return {
      ok: false,
      error:
        "Connect Google Drive in the form editor before saving file upload fields.",
    };
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("csot_track_submission_weeks").upsert(
    {
      track_slug: valid,
      week: data.week,
      title: data.title,
      description: data.description?.trim() || null,
      instructions_url: data.instructionsUrl?.trim() || null,
      fields: data.fields,
      is_open: data.isOpen,
    },
    { onConflict: "track_slug,week" },
  );

  if (error) {
    console.error("csot_track_submission_weeks upsert failed", error);
    return { ok: false, error: "Could not save submission form." };
  }

  revalidateSubmissionPaths(valid, data.week);
  return { ok: true };
}

export async function deleteTrackSubmissionWeek(
  trackSlug: string,
  week: number,
): Promise<ActionResult> {
  const valid = slugOrError(trackSlug);
  if (!valid) {
    return { ok: false, error: "This track does not have an admin portal." };
  }
  if (!(await assertEditorSession(valid))) {
    return { ok: false, error: "Not signed in." };
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("csot_track_submission_weeks")
    .delete()
    .eq("track_slug", valid)
    .eq("week", week);

  if (error) {
    console.error("csot_track_submission_weeks delete failed", error);
    return { ok: false, error: "Could not remove submission form." };
  }

  revalidateSubmissionPaths(valid, week);
  return { ok: true };
}
