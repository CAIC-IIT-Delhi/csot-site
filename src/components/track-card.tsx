import Link from "next/link";
import type { Track } from "@/lib/tracks";
import { ClubLogoStack } from "@/components/club-logo";
import { cn } from "@/lib/utils";

type Props = {
  track: Track;
  index: number;
};

export function TrackCard({ track, index }: Props) {
  const registrationOpen = track.status === "open";
  // Mild rhythm: the first card of each row of 3 gets a thicker top rule
  // and a touch more emphasis. Avoids the identical-card-grid trap.
  const isLead = index % 3 === 0;

  const body = (
    <article
      className={cn(
        "group relative flex h-full w-full flex-col justify-between gap-8 rounded-sm border border-rule bg-cream p-7 shadow-[0_1px_0_0_var(--color-rule)] transition-[transform,border-color,box-shadow] duration-150",
        isLead && "border-t-2 border-t-ink",
        "hover:-translate-y-[2px] hover:border-accent hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]",
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <ClubLogoStack clubKeys={track.clubs} size="md" />
          <p className="font-mono text-meta uppercase tracking-[0.18em] text-accent-deep">
            {track.clubs.join(" · ")}
          </p>
        </div>
        <h3 className="serif mt-4 text-h3 text-ink">{track.name}</h3>
        <p className="mt-4 text-body text-ink-soft">{track.tagline}</p>
      </div>

      <div className="flex items-end justify-between border-t border-rule/70 pt-5">
        <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
          5 weeks
        </p>
        {registrationOpen && (
          <span className="inline-flex items-center gap-1 text-meta font-medium text-ink transition-colors group-hover:text-accent-deep">
            Register
            <span aria-hidden="true">→</span>
          </span>
        )}
      </div>
    </article>
  );

  return (
    <Link
      href={`/tracks/${track.slug}/register`}
      className="flex w-full focus:outline-none focus-visible:outline-none"
      aria-label={
        registrationOpen
          ? `Register for ${track.name}`
          : `View ${track.name}`
      }
    >
      {body}
    </Link>
  );
}
