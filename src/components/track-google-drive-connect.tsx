"use client";

import type { TrackDriveConnection } from "@/lib/track-submissions/types";
import { cn } from "@/lib/utils";
import { disconnectTrackGoogleDrive } from "@/app/actions/google-drive";

type Props = {
  trackSlug: string;
  connection: TrackDriveConnection;
  onConnectionChange?: () => void;
  className?: string;
};

export function TrackGoogleDriveConnect({
  trackSlug,
  connection,
  onConnectionChange,
  className,
}: Props) {
  async function handleDisconnect() {
    if (
      !window.confirm(
        "Disconnect Google Drive? File upload fields will stop working until you connect again.",
      )
    ) {
      return;
    }
    const result = await disconnectTrackGoogleDrive(trackSlug);
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    onConnectionChange?.();
  }

  if (!connection.configured) {
    return (
      <div
        className={cn(
          "border border-warn/40 bg-paper/40 p-4",
          className,
        )}
      >
        <p className="font-mono text-meta uppercase tracking-[0.14em] text-warn">
          Google Drive not configured
        </p>
        <p className="mt-2 text-meta text-ink-soft">
          Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET on the
          server before track leads can connect.
        </p>
      </div>
    );
  }

  if (!connection.connected) {
    return (
      <div
        className={cn(
          "border border-rule bg-accent-soft/30 p-4",
          className,
        )}
      >
        <p className="font-mono text-meta uppercase tracking-[0.14em] text-accent-deep">
          Google Drive
        </p>
        <p className="mt-2 text-body text-ink-soft">
          Connect the Google account that owns your submission folders. Required
          for file upload fields — files upload directly from participants&apos;
          browsers to your Drive.
        </p>
        <a
          href={`/api/track-admin/${trackSlug}/google-drive/connect`}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-meta font-medium uppercase tracking-[0.14em] text-cream transition-transform hover:-translate-y-px"
        >
          Connect Google Drive
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-rule bg-paper/40 p-4",
        className,
      )}
    >
      <p className="font-mono text-meta uppercase tracking-[0.14em] text-success">
        Google Drive connected
      </p>
      <p className="mt-2 text-body text-ink">
        {connection.email}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <a
          href={`/api/track-admin/${trackSlug}/google-drive/connect`}
          className="text-meta uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
        >
          Reconnect
        </a>
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          className="text-meta uppercase tracking-[0.14em] text-warn hover:text-ink"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
