import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ClubLogoStack } from "@/components/club-logo";
import { LeaderboardEditor } from "@/components/leaderboard-editor";
import {
  isEditableLeaderboardSlug,
  type EditableLeaderboardSlug,
} from "@/lib/leaderboard-editor/credentials";
import {
  lookupResolved,
  resolveUsersByEntry,
} from "@/lib/leaderboard-editor/resolve-users";
import { getEditorSessionSlug } from "@/lib/leaderboard-editor/session";
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
    title: `Edit ${track.name} leaderboard · CSoT'26`,
    robots: { index: false, follow: false },
  };
}

async function loadInitialRows(slug: EditableLeaderboardSlug) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_leaderboard_entries")
    .select("rank, entry_number")
    .eq("track_slug", slug)
    .order("rank", { ascending: true });

  if (error || !data) return [];

  const users = await resolveUsersByEntry(
    data.map((r) => r.entry_number as string),
  );

  return data.map((r) => {
    const entryNumber = (r.entry_number as string).trim().toUpperCase();
    const resolved = lookupResolved(users, entryNumber);
    return {
      rank: r.rank as number,
      entryNumber,
      name: resolved.name,
      hostel: resolved.hostel,
    };
  });
}

export default async function TrackLeaderboardEditPage({ params }: Props) {
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
  const initialRows = authenticated ? await loadInitialRows(slug) : [];

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
              <p className="font-mono text-meta uppercase tracking-[0.18em] text-accent-deep">
                {track.clubs.join(" · ")}
              </p>
            </div>
            <h1 className="serif mt-4 text-h1 text-ink">
              {track.name}
              <span className="serif block text-h3 text-ink-soft">
                leaderboard editor
              </span>
            </h1>
            <p className="mt-6 text-body-lg text-ink-soft">
              Track-lead only. Enter rank and entry number; name and hostel are
              filled in from registrations when you save.
            </p>
          </aside>

          <section>
            <LeaderboardEditor
              track={track}
              authenticated={authenticated}
              initialRows={initialRows}
            />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
