import { NextResponse } from "next/server";
import {
  isEditableLeaderboardSlug,
  type EditableLeaderboardSlug,
} from "@/lib/leaderboard-editor/credentials";
import { assertEditorSession } from "@/lib/leaderboard-editor/session";
import {
  decodeOAuthState,
  exchangeGoogleDriveCode,
} from "@/lib/track-submissions/google-drive-oauth";
import { saveTrackGoogleDriveConnection } from "@/lib/track-submissions/google-drive-store";
import { siteUrl } from "@/lib/site-origin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      siteUrl(`/tracks?drive_error=${encodeURIComponent(oauthError)}`),
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing OAuth parameters." }, {
      status: 400,
    });
  }

  const payload = decodeOAuthState(state);
  if (!payload || !isEditableLeaderboardSlug(payload.trackSlug)) {
    return NextResponse.json({ error: "Invalid OAuth state." }, { status: 400 });
  }

  const trackSlug = payload.trackSlug as EditableLeaderboardSlug;
  if (!(await assertEditorSession(trackSlug))) {
    return NextResponse.redirect(siteUrl(`/tracks/${trackSlug}/admin`));
  }

  try {
    const { refreshToken, email } = await exchangeGoogleDriveCode(code);
    await saveTrackGoogleDriveConnection(trackSlug, email, refreshToken);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Google Drive connection failed.";
    return NextResponse.redirect(
      siteUrl(
        `/tracks/${trackSlug}/admin?drive_error=${encodeURIComponent(message)}`,
      ),
    );
  }

  return NextResponse.redirect(
    siteUrl(`/tracks/${trackSlug}/admin?drive=connected`),
  );
}
