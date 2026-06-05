import { parseDriveFolderId } from "@/lib/track-submissions/drive-url";

export function sanitizeParticipantName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, "_");
  const safe = trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  return safe.slice(0, 64) || "participant";
}

export function participantFolderName(
  entryNumber: string,
  name: string,
): string {
  const entry = entryNumber.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  return `${entry}_${sanitizeParticipantName(name)}`;
}

/** Parent folder link — participant subfolders are created on upload. */
export function participantDriveFolderUrl(
  driveFolderUrl: string,
  entryNumber: string,
  name: string,
): string {
  const folderId = parseDriveFolderId(driveFolderUrl);
  if (!folderId) return driveFolderUrl;
  const subfolder = participantFolderName(entryNumber, name);
  return `https://drive.google.com/drive/folders/${folderId}?q=${encodeURIComponent(`name = '${subfolder}'`)}`;
}
