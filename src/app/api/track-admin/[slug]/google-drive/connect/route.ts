import { NextResponse } from "next/server";
import {
  isEditableLeaderboardSlug,
  type EditableLeaderboardSlug,
} from "@/lib/leaderboard-editor/credentials";
import { assertEditorSession } from "@/lib/leaderboard-editor/session";
import {
  buildGoogleDriveAuthUrl,
  getGoogleOAuthConfig,
} from "@/lib/track-submissions/google-drive-oauth";
import { siteUrl } from "@/lib/site-origin";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!isEditableLeaderboardSlug(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const trackSlug = slug as EditableLeaderboardSlug;
  if (!(await assertEditorSession(trackSlug))) {
    return NextResponse.redirect(siteUrl(`/tracks/${trackSlug}/admin`));
  }

  if (!getGoogleOAuthConfig()) {
    return NextResponse.json(
      { error: "Google Drive OAuth is not configured." },
      { status: 503 },
    );
  }

  const url = buildGoogleDriveAuthUrl(trackSlug);
  return NextResponse.redirect(url);
}
