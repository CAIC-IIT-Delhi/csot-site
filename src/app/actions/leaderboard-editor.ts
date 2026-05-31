"use server";

import { revalidatePath } from "next/cache";
import {
  isEditableLeaderboardSlug,
  verifyEditorCredentials,
  type EditableLeaderboardSlug,
} from "@/lib/leaderboard-editor/credentials";
import {
  lookupResolved,
  resolveUsersByEntry,
} from "@/lib/leaderboard-editor/resolve-users";
import {
  assertEditorSession,
  clearEditorSession,
  getEditorSessionSlug,
  setEditorSession,
} from "@/lib/leaderboard-editor/session";
import { getSupabase } from "@/lib/supabase/server";
import { leaderboardEditorSaveInput } from "@/lib/validations";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type EditorRow = {
  rank: number;
  entryNumber: string;
  name: string;
  hostel: string;
};

function slugOrError(slug: string): EditableLeaderboardSlug | null {
  return isEditableLeaderboardSlug(slug) ? slug : null;
}

export async function getLeaderboardEditorSession(
  slug: string,
): Promise<{ authenticated: boolean }> {
  const valid = slugOrError(slug);
  if (!valid) return { authenticated: false };
  const sessionSlug = await getEditorSessionSlug();
  return { authenticated: sessionSlug === valid };
}

export async function loginLeaderboardEditor(
  slug: string,
  username: string,
  password: string,
): Promise<ActionResult> {
  const valid = slugOrError(slug);
  if (!valid) {
    return { ok: false, error: "This track does not have a leaderboard editor." };
  }
  if (!verifyEditorCredentials(valid, username, password)) {
    return { ok: false, error: "Invalid username or password." };
  }
  await setEditorSession(valid);
  return { ok: true };
}

export async function logoutLeaderboardEditor(): Promise<ActionResult> {
  await clearEditorSession();
  return { ok: true };
}

export async function loadLeaderboardForEdit(
  slug: string,
): Promise<{ ok: true; rows: EditorRow[] } | { ok: false; error: string }> {
  const valid = slugOrError(slug);
  if (!valid) {
    return { ok: false, error: "This track does not have a leaderboard editor." };
  }
  if (!(await assertEditorSession(valid))) {
    return { ok: false, error: "Not signed in." };
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_leaderboard_entries")
    .select("rank, entry_number")
    .eq("track_slug", valid)
    .order("rank", { ascending: true });

  if (error) {
    return { ok: false, error: "Could not load leaderboard." };
  }

  const rows = data ?? [];
  const users = await resolveUsersByEntry(
    rows.map((r) => r.entry_number as string),
  );

  return {
    ok: true,
    rows: rows.map((r) => {
      const entryNumber = (r.entry_number as string).trim().toUpperCase();
      const resolved = lookupResolved(users, entryNumber);
      return {
        rank: r.rank as number,
        entryNumber,
        name: resolved.name,
        hostel: resolved.hostel,
      };
    }),
  };
}

export async function saveLeaderboardForEdit(raw: {
  trackSlug: string;
  rows: { rank: number; entryNumber: string }[];
}): Promise<ActionResult> {
  const valid = slugOrError(raw.trackSlug);
  if (!valid) {
    return { ok: false, error: "This track does not have a leaderboard editor." };
  }
  if (!(await assertEditorSession(valid))) {
    return { ok: false, error: "Not signed in." };
  }

  const parsed = leaderboardEditorSaveInput.safeParse(raw);
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

  const normalised = parsed.data.rows.map((r) => ({
    track_slug: valid,
    rank: r.rank,
    entry_number: r.entryNumber.trim().toUpperCase(),
  }));

  const supabase = getSupabase();

  const { error: deleteError } = await supabase
    .from("csot_leaderboard_entries")
    .delete()
    .eq("track_slug", valid);

  if (deleteError) {
    return { ok: false, error: "Could not save leaderboard." };
  }

  if (normalised.length > 0) {
    const { error: insertError } = await supabase
      .from("csot_leaderboard_entries")
      .insert(normalised);

    if (insertError) {
      return { ok: false, error: "Could not save leaderboard." };
    }
  }

  revalidatePath(`/tracks/${valid}/leaderboard`);
  revalidatePath(`/tracks/${valid}/leaderboard/edit`);

  return { ok: true };
}
