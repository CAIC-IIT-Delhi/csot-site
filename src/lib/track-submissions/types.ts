export type SubmissionFieldType = "text" | "textarea" | "url" | "file";

export type SubmissionFormField = {
  id: string;
  type: SubmissionFieldType;
  label: string;
  hint?: string;
  required: boolean;
  /** URL fields only — restrict to github.com */
  githubOnly?: boolean;
  /** File fields only — e.g. "image/*,video/*,.pdf" */
  accept?: string;
  /** File fields only — public editable Google Drive folder link */
  driveFolderUrl?: string;
};

export type SubmissionWeekConfig = {
  trackSlug: string;
  week: number;
  title: string;
  description: string | null;
  instructionsUrl: string | null;
  fields: SubmissionFormField[];
  isOpen: boolean;
  submissionCount?: number;
};

/** Stored participant answers keyed by field id. File fields store Drive links. */
export type SubmissionResponses = Record<string, string | string[]>;

/** @deprecated Legacy media bucket key — may exist in old submissions */
export const MEDIA_RESPONSE_KEY = "_media";

/** Participant row for track admin submission viewer. */
export type AdminParticipantSubmission = {
  week: number;
  entryNumber: string;
  name: string;
  hostel: string;
  responses: SubmissionResponses;
  updatedAt: string;
};

export const DRIVE_FOLDER_SETUP_STEPS = [
  "Connect your Google account below (track-lead only, once per track).",
  "In Google Drive, create a folder for this field's uploads (e.g. “Week 1 submissions”).",
  "Right-click the folder → Share → General access → set to “Anyone with the link” as Editor (public editable).",
  "Copy the folder link (https://drive.google.com/drive/folders/…) and paste it below.",
  "On submit, files upload directly from the participant's browser into ENTRYNUMBER_Name/ inside that folder.",
] as const;

export type TrackDriveConnection =
  | { connected: false; configured: boolean }
  | { connected: true; configured: true; email: string };
