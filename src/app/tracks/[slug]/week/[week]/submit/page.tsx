import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ClubLogoStack } from "@/components/club-logo";
import { WeekSubmissionForm } from "@/components/week-submission-form";
import { participantFolderName } from "@/lib/track-submissions/drive-client";
import {
  getStoredSubmission,
  getSubmissionWeekConfig,
} from "@/lib/track-submissions/weeks";
import { getTrack } from "@/lib/tracks";
import { getSupabase } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string; week: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug, week } = await params;
  const track = getTrack(slug);
  const weekNum = Number.parseInt(week, 10);
  if (!track || !Number.isFinite(weekNum)) return { title: "Submission not found" };
  const config = await getSubmissionWeekConfig(slug, weekNum);
  if (!config || !config.isOpen) return { title: "Submission not found" };
  return {
    title: `Week ${weekNum} submission · ${track.name}`,
    description: config.title,
  };
}

export default async function WeekSubmitPage({ params }: Props) {
  const { slug, week: weekParam } = await params;
  const week = Number.parseInt(weekParam, 10);
  if (!Number.isFinite(week) || week < 1) notFound();

  const track = getTrack(slug);
  if (!track || track.status !== "open") notFound();

  const config = await getSubmissionWeekConfig(slug, week);
  if (!config || !config.isOpen) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <>
        <SiteNav />
        <main className="mx-auto max-w-[760px] px-6 py-24">
          <h1 className="serif text-h1">Sign in to submit</h1>
          <p className="mt-4 text-body text-ink-soft">
            <Link
              href={`/signin?callbackUrl=/tracks/${slug}/week/${week}/submit`}
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

  const { data: registration } = await supabase
    .from("csot_registrations")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("track_slug", slug)
    .maybeSingle();

  const existing = await getStoredSubmission(session.user.id, slug, week);
  const entryNumber = session.user.entryNumber ?? "";
  const name = session.user.name ?? "participant";

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[5fr_6fr] md:gap-20 md:px-10 md:py-24">
          <aside className="md:sticky md:top-10 md:self-start">
            <Link
              href={`/tracks/${slug}/register`}
              className="font-mono text-meta uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
            >
              ← {track.name}
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <ClubLogoStack clubKeys={track.clubs} size="lg" />
              <p className="font-mono text-meta uppercase tracking-[0.16em] text-accent-deep">
                Week {week}
              </p>
            </div>
            <h1 className="serif mt-4 text-h1 text-ink">{config.title}</h1>
            {config.description && (
              <p className="mt-6 text-body text-ink-soft">{config.description}</p>
            )}
            {config.instructionsUrl && (
              <a
                href={config.instructionsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 font-mono text-meta uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
              >
                Read project instructions
                <span aria-hidden="true">↗</span>
              </a>
            )}
            {config.fields.some((f) => f.type === "file") && entryNumber && (
              <p className="mt-6 text-meta text-ink-soft">
                File uploads go to Google Drive in{" "}
                <span className="font-mono text-ink">
                  {participantFolderName(entryNumber, name)}/
                </span>
              </p>
            )}
          </aside>

          <section>
            {!registration ? (
              <div className="border border-rule bg-paper/60 p-6">
                <p className="font-mono text-meta uppercase tracking-[0.16em] text-warn">
                  Registration required
                </p>
                <p className="serif mt-2 text-h3 text-ink">
                  Register for {track.name} before submitting Week {week}.
                </p>
                <Link
                  href={`/tracks/${slug}/register`}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-meta font-medium uppercase tracking-[0.14em] text-cream transition-transform hover:-translate-y-px"
                >
                  Register for this track
                </Link>
              </div>
            ) : (
              <>
                {existing && (
                  <div className="mb-8 border border-rule bg-paper/60 p-5">
                    <p className="font-mono text-meta uppercase tracking-[0.16em] text-success">
                      Already submitted
                    </p>
                    <p className="mt-2 text-meta text-ink-soft">
                      Last updated{" "}
                      {new Date(existing.updatedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      . You can update your responses below.
                    </p>
                  </div>
                )}
                <WeekSubmissionForm
                  config={config}
                  participant={{ entryNumber, name }}
                  hasExistingSubmission={Boolean(existing)}
                  initialResponses={existing?.responses ?? {}}
                />
              </>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
