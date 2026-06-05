import { getSupabase } from "@/lib/supabase/server";
import {
  defaultSubmissionFields,
  normalizeSubmissionFields,
} from "@/lib/track-submissions/fields";
import type {
  AdminParticipantSubmission,
  SubmissionResponses,
  SubmissionWeekConfig,
} from "@/lib/track-submissions/types";

export type { SubmissionWeekConfig };

type WeekRow = {
  track_slug: string;
  week: number;
  title: string;
  description: string | null;
  instructions_url: string | null;
  fields: unknown;
  is_open: boolean;
};

function mapRow(row: WeekRow): SubmissionWeekConfig {
  return {
    trackSlug: row.track_slug,
    week: row.week,
    title: row.title,
    description: row.description,
    instructionsUrl: row.instructions_url,
    fields: normalizeSubmissionFields(row.fields),
    isOpen: row.is_open,
  };
}

const WEEK_SELECT =
  "track_slug, week, title, description, instructions_url, fields, is_open";

export async function getOpenSubmissionWeeks(
  trackSlug: string,
): Promise<SubmissionWeekConfig[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_track_submission_weeks")
    .select(WEEK_SELECT)
    .eq("track_slug", trackSlug)
    .eq("is_open", true)
    .order("week", { ascending: true });

  if (error) {
    throw new Error(`csot_track_submission_weeks read failed: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRow(row as WeekRow));
}

export async function getSubmissionWeekConfig(
  trackSlug: string,
  week: number,
): Promise<SubmissionWeekConfig | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_track_submission_weeks")
    .select(WEEK_SELECT)
    .eq("track_slug", trackSlug)
    .eq("week", week)
    .maybeSingle();

  if (error) {
    throw new Error(`csot_track_submission_weeks read failed: ${error.message}`);
  }

  if (!data) return null;
  return mapRow(data as WeekRow);
}

export async function listSubmissionWeeksForAdmin(
  trackSlug: string,
): Promise<SubmissionWeekConfig[]> {
  const supabase = getSupabase();
  const { data: weeks, error } = await supabase
    .from("csot_track_submission_weeks")
    .select(WEEK_SELECT)
    .eq("track_slug", trackSlug)
    .order("week", { ascending: true });

  if (error) {
    throw new Error(`csot_track_submission_weeks read failed: ${error.message}`);
  }

  const rows = (weeks ?? []) as WeekRow[];
  if (rows.length === 0) return [];

  const { data: counts, error: countError } = await supabase
    .from("csot_track_submissions")
    .select("week")
    .eq("track_slug", trackSlug);

  if (countError) {
    throw new Error(`csot_track_submissions count failed: ${countError.message}`);
  }

  const countByWeek = new Map<number, number>();
  for (const row of counts ?? []) {
    const w = row.week as number;
    countByWeek.set(w, (countByWeek.get(w) ?? 0) + 1);
  }

  return rows.map((row) => ({
    ...mapRow(row),
    submissionCount: countByWeek.get(row.week) ?? 0,
  }));
}

export async function listParticipantSubmissionsForAdmin(
  trackSlug: string,
): Promise<AdminParticipantSubmission[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_track_submissions")
    .select(
      "week, responses, updated_at, csot_users(entry_number, name, hostel)",
    )
    .eq("track_slug", trackSlug)
    .order("week", { ascending: true });

  if (error) {
    throw new Error(`csot_track_submissions admin read failed: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const user = row.csot_users as
      | { entry_number: string | null; name: string | null; hostel: string | null }
      | { entry_number: string | null; name: string | null; hostel: string | null }[]
      | null;
    const profile = Array.isArray(user) ? user[0] : user;
    const responses =
      row.responses && typeof row.responses === "object"
        ? (row.responses as SubmissionResponses)
        : {};

    return {
      week: row.week as number,
      entryNumber: profile?.entry_number?.trim().toUpperCase() ?? "—",
      name: profile?.name?.trim() || "—",
      hostel: profile?.hostel?.trim() || "—",
      responses,
      updatedAt: row.updated_at as string,
    };
  });
}

export function emptyWeekFields() {
  return defaultSubmissionFields();
}

export type StoredSubmission = {
  responses: SubmissionResponses;
  updatedAt: string;
};

export async function getStoredSubmission(
  userId: string,
  trackSlug: string,
  week: number,
): Promise<StoredSubmission | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_track_submissions")
    .select("responses, updated_at")
    .eq("user_id", userId)
    .eq("track_slug", trackSlug)
    .eq("week", week)
    .maybeSingle();

  if (error || !data) return null;

  const responses =
    data.responses && typeof data.responses === "object"
      ? (data.responses as SubmissionResponses)
      : {};

  return {
    responses,
    updatedAt: data.updated_at as string,
  };
}
