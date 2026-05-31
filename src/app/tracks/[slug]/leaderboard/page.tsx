import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ClubLogoStack } from "@/components/club-logo";
import { getLeaderboard } from "@/lib/leaderboards";
import { getTrack, listLeaderboardTracks } from "@/lib/tracks";
import { cn } from "@/lib/utils";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listLeaderboardTracks().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const track = getTrack(slug);
  if (!track) return { title: "Track not found" };
  return {
    title: `${track.name} leaderboard · CSoT'26`,
    description: `Live leaderboard for the ${track.name} track.`,
  };
}

export default async function TrackLeaderboardPage({ params }: Props) {
  const { slug } = await params;
  const track = getTrack(slug);
  if (!track || track.status !== "open") notFound();

  const board = await getLeaderboard(track.slug);

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[5fr_6fr] md:gap-20 md:px-10 md:py-24">
          <aside className="md:sticky md:top-10 md:self-start">
            <Link
              href={`/tracks/${track.slug}/register`}
              className="font-mono text-meta uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
            >
              ← {track.name}
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
                leaderboard
              </span>
            </h1>
            <p className="mt-6 text-body-lg text-ink-soft">
              Live standings for the {track.name} track. Updates as scores
              come in.
            </p>
            <p className="mt-6 text-meta text-ink-soft">
              Refreshes roughly every minute.
            </p>
          </aside>

          <section>
            {board.status === "coming-soon" ? (
              <ComingSoonPanel note={board.note} />
            ) : board.entries.length === 0 ? (
              <EmptyPanel />
            ) : (
              <LeaderboardTable
                entries={board.entries}
                fetchedAt={board.fetchedAt}
              />
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function ComingSoonPanel({ note }: { note?: string }) {
  return (
    <div className="border border-dashed border-warn/70 bg-paper/60 p-8">
      <p className="font-mono text-meta uppercase tracking-[0.16em] text-warn">
        Coming soon
      </p>
      <p className="serif mt-3 text-h3 text-ink">
        Live leaderboard is being wired up.
      </p>
      <p className="mt-3 text-body text-ink-soft">
        {note ??
          "Track leads will switch this on once scoring starts. Check back in a bit."}
      </p>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="border border-rule bg-paper/60 p-8">
      <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
        No entries yet
      </p>
      <p className="serif mt-3 text-h3 text-ink">
        Standings will appear here as soon as scores land.
      </p>
    </div>
  );
}

function LeaderboardTable({
  entries,
  fetchedAt,
}: {
  entries: { rank: number; name: string; hostel: string }[];
  fetchedAt?: string;
}) {
  return (
    <div>
      <div className="border-y border-rule">
        <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-6 border-b border-rule px-1 py-3">
          <span className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            Rank
          </span>
          <span className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            Name
          </span>
          <span className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            Hostel
          </span>
        </div>
        <ul>
          {entries.map((entry) => {
            const isTop = entry.rank <= 3;
            return (
              <li
                key={`${entry.rank}-${entry.name}`}
                className={cn(
                  "grid grid-cols-[auto_1fr_auto] items-baseline gap-x-6 border-b border-rule/70 px-1 py-4 last:border-b-0",
                  isTop && "border-l-2 border-l-accent-deep pl-3",
                )}
              >
                <span
                  className={cn(
                    "serif tabular-nums text-h3 text-ink",
                    isTop && "text-accent-deep",
                  )}
                >
                  {entry.rank}
                </span>
                <span className="text-body text-ink">{entry.name}</span>
                <span className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft">
                  {entry.hostel}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {fetchedAt && (
        <p className="mt-4 font-mono text-meta uppercase tracking-[0.14em] text-ink-soft">
          Updated{" "}
          <time dateTime={fetchedAt}>
            {new Date(fetchedAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST
          </time>
        </p>
      )}
    </div>
  );
}
