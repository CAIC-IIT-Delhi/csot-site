import { getSupabase } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "../types";

const ENDPOINT =
  "https://csot-low-latency.devclub.in/api/public/leaderboard?limit=20";

type ApiRow = { rank: number; name: string; entry: string };
type ApiResponse = { rows: ApiRow[] };

/**
 * Low Latency track maintains its own scoring service. We fetch the public
 * leaderboard, then resolve each `entry` (entry number, e.g. "2024MT60001")
 * to a hostel via csot_users. Participants who never onboarded on this site
 * show "—" for hostel.
 */
export async function fetchLowLatencyLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(ENDPOINT, {
    next: { revalidate: 60 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Upstream ${res.status}`);
  }

  const payload = (await res.json()) as ApiResponse;
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  if (rows.length === 0) return [];

  // Build entry → hostel map from csot_users. Normalise to uppercase on both
  // sides so a stray case mismatch never silently drops a hostel.
  const entries = Array.from(
    new Set(
      rows
        .map((r) => r?.entry?.trim().toUpperCase())
        .filter((e): e is string => Boolean(e)),
    ),
  );

  const hostelByEntry = new Map<string, string>();
  if (entries.length > 0) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("csot_users")
      .select("entry_number, hostel")
      .in("entry_number", entries);
    if (error) throw new Error(`csot_users lookup failed: ${error.message}`);
    for (const row of data ?? []) {
      const key = (row.entry_number as string | null)?.trim().toUpperCase();
      const hostel = (row.hostel as string | null)?.trim();
      if (key && hostel) hostelByEntry.set(key, hostel);
    }
  }

  return rows
    .filter((r) => typeof r?.rank === "number" && r?.name)
    .map((r) => {
      const key = r.entry?.trim().toUpperCase() ?? "";
      return {
        rank: r.rank,
        name: r.name,
        hostel: hostelByEntry.get(key) ?? "—",
      };
    });
}
