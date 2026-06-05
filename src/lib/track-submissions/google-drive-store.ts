import "server-only";

import { getSupabase } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secret-box";
import type { EditableLeaderboardSlug } from "@/lib/leaderboard-editor/credentials";

export type TrackGoogleDriveConnection = {
  trackSlug: EditableLeaderboardSlug;
  email: string;
};

export async function getTrackGoogleDriveConnection(
  trackSlug: EditableLeaderboardSlug,
): Promise<TrackGoogleDriveConnection | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_track_google_drive")
    .select("track_slug, connected_email")
    .eq("track_slug", trackSlug)
    .maybeSingle();

  if (error || !data) return null;

  return {
    trackSlug: data.track_slug as EditableLeaderboardSlug,
    email: data.connected_email as string,
  };
}

export async function getTrackGoogleDriveRefreshToken(
  trackSlug: EditableLeaderboardSlug,
): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_track_google_drive")
    .select("refresh_token_encrypted")
    .eq("track_slug", trackSlug)
    .maybeSingle();

  if (error || !data?.refresh_token_encrypted) return null;
  return decryptSecret(data.refresh_token_encrypted as string);
}

export async function saveTrackGoogleDriveConnection(
  trackSlug: EditableLeaderboardSlug,
  email: string,
  refreshToken: string,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("csot_track_google_drive").upsert(
    {
      track_slug: trackSlug,
      connected_email: email,
      refresh_token_encrypted: encryptSecret(refreshToken),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "track_slug" },
  );

  if (error) {
    throw new Error(`csot_track_google_drive upsert failed: ${error.message}`);
  }
}

export async function deleteTrackGoogleDriveConnection(
  trackSlug: EditableLeaderboardSlug,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("csot_track_google_drive")
    .delete()
    .eq("track_slug", trackSlug);

  if (error) {
    throw new Error(`csot_track_google_drive delete failed: ${error.message}`);
  }
}
