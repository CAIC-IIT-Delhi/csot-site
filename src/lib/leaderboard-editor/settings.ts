import { getSupabase } from "@/lib/supabase/server";

export async function getLeaderboardUsesPoints(
  trackSlug: string,
): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_leaderboard_settings")
    .select("uses_points")
    .eq("track_slug", trackSlug)
    .maybeSingle();

  if (error) {
    throw new Error(`csot_leaderboard_settings read failed: ${error.message}`);
  }

  return Boolean(data?.uses_points);
}

export async function upsertLeaderboardUsesPoints(
  trackSlug: string,
  usesPoints: boolean,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("csot_leaderboard_settings").upsert(
    {
      track_slug: trackSlug,
      uses_points: usesPoints,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "track_slug" },
  );

  if (error) {
    throw new Error(`csot_leaderboard_settings write failed: ${error.message}`);
  }
}
