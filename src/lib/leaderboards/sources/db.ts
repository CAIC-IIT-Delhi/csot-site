import { getSupabase } from "@/lib/supabase/server";
import {
  lookupResolved,
  resolveUsersByEntry,
} from "@/lib/leaderboard-editor/resolve-users";
import type { LeaderboardEntry } from "../types";

/**
 * Leaderboard rows stored in csot_leaderboard_entries (rank + entry_number).
 * Name and hostel are resolved from csot_users at read time.
 */
export async function fetchDbLeaderboard(
  slug: string,
): Promise<LeaderboardEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_leaderboard_entries")
    .select("rank, entry_number")
    .eq("track_slug", slug)
    .order("rank", { ascending: true });

  if (error) {
    throw new Error(`csot_leaderboard_entries read failed: ${error.message}`);
  }

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const users = await resolveUsersByEntry(
    rows.map((r) => r.entry_number as string),
  );

  return rows.map((r) => {
    const entry = (r.entry_number as string).trim();
    const resolved = lookupResolved(users, entry);
    return {
      rank: r.rank as number,
      name: resolved.name,
      hostel: resolved.hostel,
    };
  });
}
