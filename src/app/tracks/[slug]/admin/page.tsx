import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ClubLogoStack } from "@/components/club-logo";
import { TrackAdminPanel } from "@/components/track-admin-panel";
import {
  isEditableLeaderboardSlug,
  type EditableLeaderboardSlug,
} from "@/lib/leaderboard-editor/credentials";
import {
  lookupResolved,
  resolveUsersByEntry,
} from "@/lib/leaderboard-editor/resolve-users";
import { getLeaderboardUsesPoints } from "@/lib/leaderboard-editor/settings";
import { getEditorSessionSlug } from "@/lib/leaderboard-editor/session";
import { listSubmissionWeeksForAdmin, listParticipantSubmissionsForAdmin } from "@/lib/track-submissions/weeks";
import { getTrackDriveConnectionStatus } from "@/app/actions/google-drive";
import { getSupabase } from "@/lib/supabase/server";
import { getTrack } from "@/lib/tracks";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const track = getTrack(slug);
  if (!track) return { title: "Track not found" };
  return {
    title: `${track.name} admin · CSoT'26`,
    robots: { index: false, follow: false },
  };
}

async function loadInitialRows(slug: EditableLeaderboardSlug) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_leaderboard_entries")
    .select("rank, entry_number, points")
    .eq("track_slug", slug)
    .order("rank", { ascending: true });

  if (error || !data) return [];

  const users = await resolveUsersByEntry(
    data.map((r) => r.entry_number as string),
  );

  return data.map((r) => {
    const entryNumber = (r.entry_number as string).trim().toUpperCase();
    const resolved = lookupResolved(users, entryNumber);
    const rawPoints = r.points as number | string | null;
    const points =
      rawPoints === null || rawPoints === undefined
        ? null
        : Number(rawPoints);
    return {
      rank: r.rank as number,
      entryNumber,
      name: resolved.name,
      hostel: resolved.hostel,
      points: Number.isFinite(points) ? points : null,
    };
  });
}

export default async function TrackAdminPage({ params }: Props) {
  const { slug } = await params;
  const track = getTrack(slug);

  if (
    !track ||
    track.status !== "open" ||
    !isEditableLeaderboardSlug(slug)
  ) {
    notFound();
  }

  const sessionSlug = await getEditorSessionSlug();
  const authenticated = sessionSlug === slug;
  const initialDriveConnection = await getTrackDriveConnectionStatus(slug);

  const [initialRows, initialUsesPoints, initialWeeks, initialSubmissions] =
    authenticated
      ? await Promise.all([
          loadInitialRows(slug),
          getLeaderboardUsesPoints(slug),
          listSubmissionWeeksForAdmin(slug),
          listParticipantSubmissionsForAdmin(slug),
        ])
      : [[], false, [], []];

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[5fr_6fr] md:gap-20 md:px-10 md:py-24">
          <aside className="md:sticky md:top-10 md:self-start">
            <Link
              href={`/tracks/${track.slug}/leaderboard`}
              className="font-mono text-meta uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
            >
              ← Public leaderboard
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <ClubLogoStack clubKeys={track.clubs} size="lg" />
              <p className="font-mono text-meta uppercase tracking-[0.16em] text-accent-deep">
                {track.clubs.join(" · ")}
              </p>
            </div>
            <h1 className="serif mt-4 text-h1 text-ink">
              {track.name}
              <span className="serif block text-h3 text-ink-soft">
                track admin
              </span>
            </h1>
            <p className="mt-6 text-body-lg text-ink-soft">
              Track-lead only. Edit the live leaderboard, configure weekly
              submission forms, and review participant submissions.
            </p>
            <p className="mt-4 text-meta text-ink-soft">
              Not linked in public nav — bookmark this URL. Credentials are the
              same as the legacy leaderboard editor.
            </p>
          </aside>

          <section>
            <TrackAdminPanel
              track={track}
              authenticated={authenticated}
              initialRows={initialRows}
              initialUsesPoints={initialUsesPoints}
              initialWeeks={initialWeeks}
              initialSubmissions={initialSubmissions}
              initialDriveConnection={initialDriveConnection}
            />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
