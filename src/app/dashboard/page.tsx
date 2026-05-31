import Link from "next/link";
import { auth } from "@/auth";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getSupabase } from "@/lib/supabase/server";
import { getTrack, listTracks } from "@/lib/tracks";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  // middleware redirects unauthenticated, but defend anyway
  if (!session?.user?.id) {
    return (
      <>
        <SiteNav />
        <main className="mx-auto max-w-[760px] px-6 py-24">
          <p>Please sign in.</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const supabase = getSupabase();
  const { data: rows } = await supabase
    .from("csot_registrations")
    .select("track_slug, commitment_hours, created_at, updated_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  const registrations = (rows ?? []).map((r) => {
    const track = getTrack(r.track_slug);
    return { ...r, track };
  });

  const openTracks = listTracks().filter((t) => t.status === "open");
  const remaining = openTracks.filter(
    (t) => !registrations.some((r) => r.track_slug === t.slug),
  );

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <div className="mx-auto max-w-[1180px] px-6 py-16 md:px-10 md:py-24">
          <p className="font-mono text-meta uppercase tracking-[0.22em] text-accent-deep">
            Your dashboard
          </p>
          <h1 className="serif mt-3 text-h1 text-ink">
            Hi {session.user.name?.split(" ")[0] ?? "there"}.
          </h1>
          <p className="mt-4 max-w-xl text-body-lg text-ink-soft">
            {registrations.length === 0
              ? "You have not registered for a track yet."
              : `Registered for ${registrations.length} ${registrations.length === 1 ? "track" : "tracks"}.`}
          </p>

          {registrations.length > 0 && (
            <section className="mt-16">
              <p className="font-mono text-meta uppercase tracking-[0.18em] text-ink-soft">
                Registered tracks
              </p>
              <ul className="mt-6 divide-y divide-rule border-y border-rule">
                {registrations.map((r) => (
                  <li
                    key={r.track_slug}
                    className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-mono text-meta uppercase tracking-[0.16em] text-accent-deep">
                        {r.track?.clubs.join(" · ") ?? "—"}
                      </p>
                      <p className="serif mt-1 text-h3 text-ink">
                        {r.track?.name ?? r.track_slug}
                      </p>
                      <p className="mt-1 text-meta text-ink-soft">
                        {r.commitment_hours} h/week
                      </p>
                    </div>
                    <div className="flex items-center gap-5">
                      <Link
                        href={`/tracks/${r.track_slug}/register`}
                        className="text-meta uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
                      {r.track?.status === "open" && (
                        <Link
                          href={`/tracks/${r.track_slug}/leaderboard`}
                          className="text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
                        >
                          Leaderboard ↗
                        </Link>
                      )}
                      {r.track?.trackUrl ? (
                        <a
                          href={r.track.trackUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-meta uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
                        >
                          Launch track ↗
                        </a>
                      ) : (
                        <span
                          aria-disabled="true"
                          title="The organisers will share this link soon."
                          className="cursor-not-allowed text-meta uppercase tracking-[0.14em] text-ink-soft/60"
                        >
                          Launch soon
                        </span>
                      )}
                      {r.track?.platformUrl && (
                        <a
                          href={r.track.platformUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-meta uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
                        >
                          Platform ↗
                        </a>
                      )}
                      {r.track?.whatsappUrl ? (
                        <a
                          href={r.track.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-meta uppercase tracking-[0.14em] text-success hover:text-ink"
                        >
                          WhatsApp ↗
                        </a>
                      ) : (
                        <span
                          aria-disabled="true"
                          title="The organisers will share this link soon."
                          className="cursor-not-allowed text-meta uppercase tracking-[0.14em] text-ink-soft/60"
                        >
                          WhatsApp soon
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {remaining.length > 0 && (
            <section className="mt-20">
              <p className="font-mono text-meta uppercase tracking-[0.18em] text-ink-soft">
                {registrations.length === 0 ? "Pick a track to start" : "Explore more"}
              </p>
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {remaining.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/tracks/${t.slug}/register`}
                      className="group flex items-center justify-between border border-rule bg-cream px-5 py-4 transition-colors hover:border-accent"
                    >
                      <span>
                        <span className="block font-mono text-meta uppercase tracking-[0.16em] text-accent-deep">
                          {t.clubs.join(" · ")}
                        </span>
                        <span className="serif mt-1 block text-body text-ink">
                          {t.name}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-ink-soft transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
