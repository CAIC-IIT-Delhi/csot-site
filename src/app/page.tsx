import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { TrackCard } from "@/components/track-card";
import { listTracks } from "@/lib/tracks";

export default function HomePage() {
  const tracks = listTracks();
  const trackCount = tracks.length;

  return (
    <>
      <SiteNav />
      <main className="flex flex-1 flex-col">
        <Hero trackCount={trackCount} />
        <Pillars />
        <TracksSection tracks={tracks} trackCount={trackCount} />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero({ trackCount }: { trackCount: number }) {
  return (
    <section className="border-b border-rule/70">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-6 py-24 md:grid-cols-[5fr_4fr] md:gap-16 md:px-10 md:py-32">
        <div>
          <p className="font-mono text-meta uppercase tracking-[0.22em] text-accent-deep">
            CAIC · IIT Delhi · Summer 2026
          </p>
          <h1 className="serif mt-6 text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.02] tracking-tight text-ink">
            Pick a track. Build something. See what tech you actually like.
          </h1>
          <p className="mt-8 max-w-xl text-body-lg text-ink-soft">
            CSoT is a five-week summer programme by the Co-curricular and
            Academic Interactions Council. {trackCount} tracks, run by clubs across
            campus, each scoped so a fresher can finish them. The learning curve
            is gentle on purpose.
          </p>
          <div className="mt-10 flex items-center gap-6">
            <a
              href="#tracks"
              className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-7 text-body font-medium text-cream transition-transform hover:-translate-y-px"
            >
              See the tracks
            </a>
            <a
              href="#how"
              className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft underline-offset-4 hover:underline"
            >
              How it works
            </a>
          </div>
        </div>

        <aside className="self-end border-l border-rule pl-8 md:pl-10">
          <p className="font-mono text-meta uppercase tracking-[0.18em] text-ink-soft">
            At a glance
          </p>
          <dl className="mt-6 space-y-5">
            <Stat label="Tracks" value={String(trackCount)} />
            <Stat label="Weeks per track" value="5" />
            <Stat label="Prior experience" value="None required" />
            <Stat label="Open to" value="IIT Delhi students" />
          </dl>
        </aside>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-rule/60 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-body text-ink-soft">{label}</dt>
      <dd className="serif text-h3 text-ink">{value}</dd>
    </div>
  );
}

function Pillars() {
  return (
    <section id="how" className="mx-auto max-w-[1180px] px-6 py-24 md:px-10">
      <p className="font-mono text-meta uppercase tracking-[0.22em] text-accent-deep">
        What to expect
      </p>
      <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-x-16">
        <Pillar
          heading="Learn by doing, not by watching."
          body="Each track is built around a small project you actually ship. Lectures exist where they help, and not as the main event."
        />
        <Pillar
          heading="The bar is intentionally low to start."
          body="Tracks are scoped so a first-year with no background can finish them. Stretch goals are there if you want them. Nobody gets gatekept."
        />
        <Pillar
          heading="Mentors are people you can actually talk to."
          body="Each track is run by the relevant campus club. You will know the names. Office hours, not ticket queues."
        />
        <Pillar
          heading="Useful for Inter-IIT, but not only that."
          body="Themes are drawn from past Inter-IIT Tech Meet problem statements. Early insight into the working contingent is a real perk."
        />
      </div>
    </section>
  );
}

function Pillar({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="border-t border-rule pt-6">
      <h3 className="serif text-h3 text-ink">{heading}</h3>
      <p className="mt-3 max-w-[34rem] text-body text-ink-soft">{body}</p>
    </div>
  );
}

function TracksSection({
  tracks,
  trackCount,
}: {
  tracks: ReturnType<typeof listTracks>;
  trackCount: number;
}) {
  return (
    <section
      id="tracks"
      className="border-y border-rule/70 bg-paper/40 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1180px] px-6 md:px-10">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="font-mono text-meta uppercase tracking-[0.22em] text-accent-deep">
              The tracks
            </p>
            <h2 className="serif mt-4 text-h2 text-ink">
              {trackCount} ways in. Pick more than one.
            </h2>
          </div>
          <p className="hidden max-w-xs text-meta text-ink-soft md:block">
            You can register for as many tracks as you have time for. Each card
            opens a short registration form.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
          {tracks.map((track, i) => (
            <li key={track.slug} className="flex">
              <TrackCard track={track} index={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-24 md:px-10 md:py-32">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_3fr] md:gap-16">
        <div>
          <p className="font-mono text-meta uppercase tracking-[0.22em] text-accent-deep">
            Inspired by
          </p>
          <p className="serif mt-4 text-h2 text-ink">
            DevClub Summer of Code.
          </p>
        </div>
        <div className="border-t border-rule pt-6">
          <p className="text-body-lg text-ink-soft">
            CSoT borrows the structure of DevClub Summer of Code and extends it
            across CAIC: clubs from analytics to robotics to consult, all in one
            place, with one sign-in. Built so the next batch of students has an
            obvious first step into the campus tech community.
          </p>
        </div>
      </div>
    </section>
  );
}
