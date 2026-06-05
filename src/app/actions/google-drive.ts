"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  isEditableLeaderboardSlug,
  type EditableLeaderboardSlug,
} from "@/lib/leaderboard-editor/credentials";
import { assertEditorSession } from "@/lib/leaderboard-editor/session";
import { participantFolderName } from "@/lib/track-submissions/drive-client";
import {
  ensureParticipantDriveFolder,
  mintTrackDriveAccessToken,
} from "@/lib/track-submissions/drive-server";
import {
  deleteTrackGoogleDriveConnection,
  getTrackGoogleDriveConnection,
} from "@/lib/track-submissions/google-drive-store";
import { getGoogleOAuthConfig } from "@/lib/track-submissions/google-drive-oauth";
import { getSubmissionWeekConfig } from "@/lib/track-submissions/weeks";
import { getSupabase } from "@/lib/supabase/server";
import { getTrack } from "@/lib/tracks";

export type DriveActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type DriveConnectionStatus =
  | { connected: false; configured: boolean }
  | { connected: true; configured: true; email: string };

export async function getTrackDriveConnectionStatus(
  trackSlug: string,
): Promise<DriveConnectionStatus> {
  const configured = Boolean(getGoogleOAuthConfig());
  if (!isEditableLeaderboardSlug(trackSlug)) {
    return { connected: false, configured };
  }
  const conn = await getTrackGoogleDriveConnection(trackSlug);
  if (!conn) return { connected: false, configured };
  return { connected: true, configured: true, email: conn.email };
}

export async function disconnectTrackGoogleDrive(
  trackSlug: string,
): Promise<DriveActionResult> {
  if (!isEditableLeaderboardSlug(trackSlug)) {
    return { ok: false, error: "Invalid track." };
  }
  const slug = trackSlug as EditableLeaderboardSlug;
  if (!(await assertEditorSession(slug))) {
    return { ok: false, error: "Not signed in." };
  }

  try {
    await deleteTrackGoogleDriveConnection(slug);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not disconnect.",
    };
  }

  revalidatePath(`/tracks/${slug}/admin`);
  return { ok: true };
}

export type PrepareDriveUploadResult =
  | {
      ok: true;
      accessToken: string;
      targets: Record<string, { parentFolderId: string }>;
    }
  | { ok: false; error: string };

async function requireRegisteredForTrack(
  userId: string,
  trackSlug: string,
): Promise<{ ok: false; error: string } | null> {
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

/** Mint a short-lived access token and participant subfolder IDs for client upload. */
export async function prepareTrackWeekDriveUploads(raw: {
  trackSlug: string;
  week: number;
  uploads: { fieldId: string; driveFolderUrl: string }[];
}): Promise<PrepareDriveUploadResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to upload files." };
  }

  const trackSlug = raw.trackSlug.trim();
  const week = raw.week;
  if (!trackSlug || !Number.isFinite(week) || week < 1) {
    return { ok: false, error: "Invalid submission." };
  }

  if (!isEditableLeaderboardSlug(trackSlug)) {
    return { ok: false, error: "Invalid track." };
  }
  const slug = trackSlug as EditableLeaderboardSlug;

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

  const entryNumber = session.user.entryNumber?.trim();
  const name = session.user.name?.trim() || "participant";
  if (!entryNumber) {
    return {
      ok: false,
      error: "Your profile is missing an entry number. Contact organisers.",
    };
  }

  if (raw.uploads.length === 0) {
    return { ok: false, error: "No files to upload." };
  }

  const fieldById = new Map(weekConfig.fields.map((f) => [f.id, f]));
  const folderName = participantFolderName(entryNumber, name);
  const targets: Record<string, { parentFolderId: string }> = {};

  try {
    for (const item of raw.uploads) {
      const field = fieldById.get(item.fieldId);
      if (!field || field.type !== "file") {
        return { ok: false, error: "Invalid file field." };
      }
      const configuredUrl = field.driveFolderUrl?.trim();
      const requestedUrl = item.driveFolderUrl.trim();
      if (!configuredUrl || configuredUrl !== requestedUrl) {
        return { ok: false, error: "Drive folder mismatch for a file field." };
      }

      const parentFolderId = await ensureParticipantDriveFolder(
        slug,
        configuredUrl,
        folderName,
      );
      targets[item.fieldId] = { parentFolderId };
    }

    const accessToken = await mintTrackDriveAccessToken(slug);
    return { ok: true, accessToken, targets };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not prepare upload.",
    };
  }
}

export async function trackHasGoogleDriveConnected(
  trackSlug: EditableLeaderboardSlug,
): Promise<boolean> {
  const conn = await getTrackGoogleDriveConnection(trackSlug);
  return conn !== null;
}
