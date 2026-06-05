import "server-only";

import { google } from "googleapis";
import { parseDriveFolderId } from "@/lib/track-submissions/drive-url";
import { createGoogleOAuth2Client, fetchGoogleDriveAccessToken } from "@/lib/track-submissions/google-drive-oauth";
import { getTrackGoogleDriveRefreshToken } from "@/lib/track-submissions/google-drive-store";
import type { EditableLeaderboardSlug } from "@/lib/leaderboard-editor/credentials";

export {
  parseDriveFolderId,
  isDriveFolderUrl,
} from "@/lib/track-submissions/drive-url";
export {
  participantFolderName,
  sanitizeParticipantName,
  participantDriveFolderUrl,
} from "@/lib/track-submissions/drive-client";

async function getDriveForTrack(trackSlug: EditableLeaderboardSlug) {
  const refreshToken = await getTrackGoogleDriveRefreshToken(trackSlug);
  if (!refreshToken) {
    throw new Error(
      "Google Drive is not connected for this track. The track lead must connect in admin.",
    );
  }

  const client = createGoogleOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth: client });
}

async function findChildFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string,
): Promise<string | null> {
  const escaped = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
  });
  return res.data.files?.[0]?.id ?? null;
}

export async function ensureParticipantDriveFolder(
  trackSlug: EditableLeaderboardSlug,
  driveFolderUrl: string,
  folderName: string,
): Promise<string> {
  const parentId = parseDriveFolderId(driveFolderUrl);
  if (!parentId) {
    throw new Error("Invalid Google Drive folder link.");
  }

  const drive = await getDriveForTrack(trackSlug);
  const existing = await findChildFolder(drive, parentId, folderName);
  if (existing) return existing;

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  const id = created.data.id;
  if (!id) throw new Error("Could not create Drive folder.");
  return id;
}

export async function mintTrackDriveAccessToken(
  trackSlug: EditableLeaderboardSlug,
): Promise<string> {
  const refreshToken = await getTrackGoogleDriveRefreshToken(trackSlug);
  if (!refreshToken) {
    throw new Error(
      "Google Drive is not connected for this track. The track lead must connect in admin.",
    );
  }
  return fetchGoogleDriveAccessToken(refreshToken);
}
