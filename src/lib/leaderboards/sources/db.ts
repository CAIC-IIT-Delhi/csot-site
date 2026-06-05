import {
  getLeaderboardUsesPoints,
} from "@/lib/leaderboard-editor/settings";
import {
  lookupResolved,
  resolveUsersByEntry,
} from "@/lib/leaderboard-editor/resolve-users";
import { getSupabase } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "../types";

export type DbLeaderboardData = {
  entries: LeaderboardEntry[];
  usesPoints: boolean;
};

/**
 * Leaderboard rows stored in csot_leaderboard_entries (rank + entry_number).
 * Name and hostel are resolved from csot_users at read time.
 */
export async function fetchDbLeaderboard(
  slug: string,
): Promise<DbLeaderboardData> {
  const supabase = getSupabase();
  const [usesPoints, entriesResult] = await Promise.all([
    getLeaderboardUsesPoints(slug),
    supabase
      .from("csot_leaderboard_entries")
      .select("rank, entry_number, points")
      .eq("track_slug", slug)
      .order("rank", { ascending: true }),
  ]);

  const { data, error } = entriesResult;
  if (error) {
    throw new Error(`csot_leaderboard_entries read failed: ${error.message}`);
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return { entries: [], usesPoints };
  }

  const users = await resolveUsersByEntry(
    rows.map((r) => r.entry_number as string),
  );

  const entries = rows.map((r) => {
    const entry = (r.entry_number as string).trim();
    const resolved = lookupResolved(users, entry);
    const rawPoints = r.points as number | string | null;
    const points =
      rawPoints === null || rawPoints === undefined
        ? null
        : Number(rawPoints);
    return {
      rank: r.rank as number,
      name: resolved.name,
      hostel: resolved.hostel,
      ...(usesPoints ? { points: Number.isFinite(points) ? points : null } : {}),
    };
  });

  return { entries, usesPoints };
}
