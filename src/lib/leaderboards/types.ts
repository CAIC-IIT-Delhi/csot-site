export type LeaderboardEntry = {
  rank: number;
  name: string;
  hostel: string;
  /** Present when the track editor has points enabled. */
  points?: number | null;
};

export type LeaderboardSource =
  | { kind: "coming-soon"; note?: string }
  | {
      kind: "hardcoded";
      entries: LeaderboardEntry[];
      updatedAt?: string;
    }
  | {
      kind: "api";
      fetch: () => Promise<LeaderboardEntry[]>;
      /** Per-source override for ISR. Page-level default is 60s. */
      revalidateSec?: number;
    }
  | { kind: "db" };

export type LeaderboardStatus = "coming-soon" | "live";

export type LeaderboardResult = {
  status: LeaderboardStatus;
  entries: LeaderboardEntry[];
  /** DB-backed tracks: whether the public table shows a Points column. */
  usesPoints?: boolean;
  /** Human note shown when coming-soon or live-but-empty. */
  note?: string;
  /** ISO timestamp when the data was last considered fresh. */
  fetchedAt?: string;
};
