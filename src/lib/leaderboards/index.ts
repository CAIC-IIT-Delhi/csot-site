import { EDITABLE_LEADERBOARD_SLUGS } from "@/lib/leaderboard-editor/credentials";
import { trackSlugs } from "@/lib/tracks";
import { fetchDbLeaderboard } from "./sources/db";
import { fetchLowLatencyLeaderboard } from "./sources/low-latency";
import type {
  LeaderboardEntry,
  LeaderboardResult,
  LeaderboardSource,
} from "./types";

/**
 * Per-track leaderboard sources. Every track slug must have an entry. The
 * default is `{ kind: "coming-soon" }`; wire a real source by pointing at a
 * module under `./sources/<slug>.ts` and switching the kind to "hardcoded"
 * (returning a literal array) or "api" (returning a fetcher).
 *
 * Editable tracks (see EDITABLE_LEADERBOARD_SLUGS) use `{ kind: "db" }` unless
 * overridden here (e.g. low-latency uses its own API).
 */
const OVERRIDES: Record<string, LeaderboardSource> = {
  "low-latency": { kind: "api", fetch: fetchLowLatencyLeaderboard },
};

function defaultSourceForSlug(slug: string): LeaderboardSource {
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  if ((EDITABLE_LEADERBOARD_SLUGS as readonly string[]).includes(slug)) {
    return { kind: "db" };
  }
  return { kind: "coming-soon" };
}

export const LEADERBOARDS: Record<string, LeaderboardSource> =
  Object.fromEntries(
    trackSlugs().map((slug) => [slug, defaultSourceForSlug(slug)]),
  );

function normalise(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => a.rank - b.rank)
    .map((entry, i) => ({
      rank: entry.rank ?? i + 1,
      name: entry.name.trim() || "—",
      hostel: entry.hostel.trim() || "—",
    }));
}

export async function getLeaderboard(slug: string): Promise<LeaderboardResult> {
  const source = LEADERBOARDS[slug];
  if (!source) {
    return { status: "coming-soon", entries: [] };
  }

  if (source.kind === "coming-soon") {
    return { status: "coming-soon", entries: [], note: source.note };
  }

  if (source.kind === "hardcoded") {
    return {
      status: "live",
      entries: normalise(source.entries),
      fetchedAt: source.updatedAt,
    };
  }

  try {
    const raw =
      source.kind === "db"
        ? await fetchDbLeaderboard(slug)
        : await source.fetch();
    return {
      status: "live",
      entries: normalise(raw),
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: "coming-soon",
      entries: [],
      note:
        err instanceof Error
          ? `Live source unavailable: ${err.message}`
          : "Live source unavailable.",
    };
  }
}

export type { LeaderboardEntry, LeaderboardResult, LeaderboardSource } from "./types";
