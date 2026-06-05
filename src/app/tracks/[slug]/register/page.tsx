import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { RegistrationForm } from "@/components/registration-form";
import { WithdrawButton } from "@/components/withdraw-button";
import { ClubLogoStack } from "@/components/club-logo";
import { getTrack, formatTrackStartDate } from "@/lib/tracks";
import { getOpenSubmissionWeeks } from "@/lib/track-submissions/weeks";
import { submissionWeekPath } from "@/lib/track-submissions/paths";
import { getSupabase } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const track = getTrack(slug);
  if (!track) return { title: "Track not found" };
  return {
    title: `${track.name} · CSoT'26 registration`,
    description: track.tagline,
  };
}

export default async function TrackRegisterPage({ params }: Props) {
  const { slug } = await params;
  const track = getTrack(slug);
  if (!track) notFound();

  const session = await auth();
  // middleware should have redirected, but defend anyway
  if (!session?.user?.id) {
    return (
      <>
        <SiteNav />
        <main className="mx-auto max-w-[760px] px-6 py-24">
          <h1 className="serif text-h1">Sign in to register</h1>
          <p className="mt-4 text-body text-ink-soft">
            <Link
              href={`/signin?callbackUrl=/tracks/${slug}/register`}
              className="underline decoration-accent underline-offset-4"
            >
              Continue
            </Link>
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("csot_registrations")
    .select("past_experience, why_track, commitment_hours")
    .eq("user_id", session.user.id)
    .eq("track_slug", track.slug)
    .maybeSingle();

  const { count: registrationCount } = await supabase
    .from("csot_registrations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id);

  const profileLocked = (registrationCount ?? 0) > 0;

  const registrationOpen = track.status === "open";

  const openSubmissionWeeks = existing
    ? await getOpenSubmissionWeeks(track.slug)
    : [];

  const userProfile = {
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    kerberos: session.user.kerberos,
    entryNumber: session.user.entryNumber,
    department: session.user.department,
    hostel: session.user.hostel,
    entryYear: session.user.entryYear,
    phone: session.user.phone,
  };

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[5fr_6fr] md:gap-20 md:px-10 md:py-24">
          <aside className="md:sticky md:top-10 md:self-start">
            <Link
              href="/#tracks"
              className="font-mono text-meta uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
            >
              ← All tracks
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <ClubLogoStack clubKeys={track.clubs} size="lg" />
              <p className="font-mono text-meta uppercase tracking-[0.18em] text-accent-deep">
                {track.clubs.join(" · ")}
              </p>
            </div>
            <h1 className="serif mt-4 text-h1 text-ink">{track.name}</h1>
            <p className="mt-4 font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
              Start date ·{" "}
              <span
                className={
                  track.startDate === "started"
                    ? "text-success"
                    : track.startDate === "tba"
                      ? "text-warn"
                      : "text-ink"
                }
              >
                {formatTrackStartDate(track.startDate)}
              </span>
            </p>
            <p className="mt-6 text-body-lg text-ink-soft">{track.tagline}</p>
            <p className="mt-6 text-body text-ink-soft">{track.about}</p>
            {registrationOpen && (
              <Link
                href={`/tracks/${track.slug}/leaderboard`}
                className="mt-6 inline-flex items-center gap-2 font-mono text-meta uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
              >
                View live leaderboard
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </aside>

          <section>
            {!registrationOpen && !existing ? null : existing ? (
              <div>
                <div className="border border-rule bg-paper/60 p-6">
                  <p className="font-mono text-meta uppercase tracking-[0.16em] text-success">
                    You are registered
                  </p>
                  <p className="serif mt-2 text-h3 text-ink">
                    You are all set for this track.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-rule pt-5">
                    {track.trackUrl ? (
                      <a
                        href={track.trackUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-meta font-medium uppercase tracking-[0.14em] text-cream transition-transform hover:-translate-y-px"
                      >
                        Launch track
                        <span aria-hidden="true" className="ml-2">
                          ↗
                        </span>
                      </a>
                    ) : (
                      <span
                        aria-disabled="true"
                        title="The organisers will share this link soon."
                        className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full border border-dashed border-rule px-5 text-meta font-medium uppercase tracking-[0.14em] text-ink-soft/70"
                      >
                        Launch track
                      </span>
                    )}
                    {track.platformUrl && (
                      <a
                        href={track.platformUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-full border border-ink px-5 text-meta font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-cream"
                      >
                        Launch platform
                        <span aria-hidden="true" className="ml-2">
                          ↗
                        </span>
                      </a>
                    )}
                    {track.whatsappUrl ? (
                      <a
                        href={track.whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-full border border-rule px-5 text-meta font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
                      >
                        Join WhatsApp group
                        <span aria-hidden="true" className="ml-2">
                          ↗
                        </span>
                      </a>
                    ) : (
                      <span
                        aria-disabled="true"
                        title="The organisers will share this link soon."
                        className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full border border-dashed border-rule px-5 text-meta font-medium uppercase tracking-[0.14em] text-ink-soft/70"
                      >
                        WhatsApp soon
                      </span>
                    )}
                    {openSubmissionWeeks.map((w) => (
                      <Link
                        key={w.week}
                        href={submissionWeekPath(track.slug, w.week)}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-accent px-5 text-meta font-medium uppercase tracking-[0.14em] text-accent-deep transition-colors hover:bg-accent-soft"
                      >
                        Submit Week {w.week}
                      </Link>
                    ))}
                  </div>
                  {!track.trackUrl && (
                    <p className="mt-3 text-meta text-warn">
                      Track content link coming soon — organisers will post it here.
                    </p>
                  )}
                </div>

                <div className="mt-10 border-t border-rule pt-8">
                  <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
                    Your responses
                  </p>
                  <dl className="mt-4 space-y-5">
                    <RegisteredField
                      label="Relevant experience"
                      value={existing.past_experience}
                    />
                    <RegisteredField
                      label="Why this track"
                      value={existing.why_track}
                    />
                    <RegisteredField
                      label="Hours per week"
                      value={`${existing.commitment_hours} h/week`}
                    />
                  </dl>
                </div>

                <div className="mt-12 border-t border-rule pt-8">
                  <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
                    Danger zone
                  </p>
                  <WithdrawButton trackSlug={track.slug} trackName={track.name} />
                </div>

                <p className="mt-8">
                  <Link
                    href="/dashboard"
                    className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
                  >
                    ← Dashboard
                  </Link>
                </p>
              </div>
            ) : (
              <RegistrationForm
                trackSlug={track.slug}
                user={userProfile}
                profileLocked={profileLocked}
                initial={{
                  pastExperience: "",
                  whyTrack: "",
                  commitmentHours: 6,
                }}
                submitLabel="Register"
              />
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function RegisteredField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
        {label}
      </dt>
      <dd className="mt-2 whitespace-pre-wrap text-body text-ink">{value}</dd>
    </div>
  );
}
