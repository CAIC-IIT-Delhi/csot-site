"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/tracks";
import { cn } from "@/lib/utils";
import {
  loadLeaderboardForEdit,
  loginLeaderboardEditor,
  logoutLeaderboardEditor,
  saveLeaderboardForEdit,
  type EditorRow,
} from "@/app/actions/leaderboard-editor";

type LocalRow = EditorRow & { key: string };

type Props = {
  track: Track;
  authenticated: boolean;
  initialRows: EditorRow[];
  initialUsesPoints: boolean;
  /** When true, login is handled by a parent (e.g. track admin). */
  embedded?: boolean;
};

function nextKey() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toLocalRows(rows: EditorRow[]): LocalRow[] {
  return rows.map((r) => ({ ...r, key: nextKey() }));
}

export function LeaderboardEditor({
  track,
  authenticated: initialAuthenticated,
  initialRows,
  initialUsesPoints,
  embedded = false,
}: Props) {
  const router = useRouter();
  const promptedRef = useRef(false);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [usesPoints, setUsesPoints] = useState(initialUsesPoints);
  const [rows, setRows] = useState<LocalRow[]>(() => toLocalRows(initialRows));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [loginMessage, setLoginMessage] = useState<string>();

  const applyLoaded = useCallback(
    (loaded: { rows: EditorRow[]; usesPoints: boolean }) => {
      setUsesPoints(loaded.usesPoints);
      setRows(toLocalRows(loaded.rows));
    },
    [],
  );

  const handleSignIn = useCallback(async () => {
    const username = window.prompt("Username");
    if (username === null) return;
    const password = window.prompt("Password");
    if (password === null) return;

    const result = await loginLeaderboardEditor(
      track.slug,
      username,
      password,
    );
    if (!result.ok) {
      window.alert(result.error);
      setLoginMessage(result.error);
      return;
    }

    setAuthenticated(true);
    setLoginMessage(undefined);
    const loaded = await loadLeaderboardForEdit(track.slug);
    if (loaded.ok) {
      applyLoaded(loaded);
    }
    router.refresh();
  }, [applyLoaded, track.slug, router]);

  async function handleSignOut() {
    await logoutLeaderboardEditor();
    setAuthenticated(false);
    setUsesPoints(false);
    setRows([]);
    setLoginMessage("Signed out.");
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    setError(undefined);
    const result = await saveLeaderboardForEdit({
      trackSlug: track.slug,
      usesPoints,
      rows: rows.map((r) => ({
        rank: r.rank,
        entryNumber: r.entryNumber,
        points: usesPoints ? r.points : null,
      })),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const loaded = await loadLeaderboardForEdit(track.slug);
    if (loaded.ok) {
      applyLoaded(loaded);
    }
    router.refresh();
  }

  useEffect(() => {
    if (embedded || initialAuthenticated || promptedRef.current) return;
    promptedRef.current = true;
    void handleSignIn();
  }, [embedded, initialAuthenticated, handleSignIn]);

  if (!authenticated) {
    if (embedded) {
      return (
        <p className="text-body text-ink-soft">
          Sign in above to edit the leaderboard.
        </p>
      );
    }
    return (
      <div className="border border-rule bg-paper/60 p-8">
        <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
          Editor login
        </p>
        <p className="serif mt-3 text-h3 text-ink">
          {loginMessage ?? "Sign in to edit this leaderboard."}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => void handleSignIn()}
            className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-meta font-medium uppercase tracking-[0.14em] text-cream transition-transform hover:-translate-y-px"
          >
            Sign in
          </button>
          <Link
            href={`/tracks/${track.slug}/leaderboard`}
            className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
          >
            View public leaderboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EditorTable
      rows={rows}
      usesPoints={usesPoints}
      saving={saving}
      error={error}
      onUsesPointsChange={setUsesPoints}
      onChange={setRows}
      onSave={() => void handleSave()}
      onSignOut={() => void handleSignOut()}
    />
  );
}

function EditorTable({
  rows,
  usesPoints,
  saving,
  error,
  onUsesPointsChange,
  onChange,
  onSave,
  onSignOut,
}: {
  rows: LocalRow[];
  usesPoints: boolean;
  saving: boolean;
  error?: string;
  onUsesPointsChange: (value: boolean) => void;
  onChange: (rows: LocalRow[]) => void;
  onSave: () => void;
  onSignOut: () => void;
}) {
  const gridCols = usesPoints
    ? "grid-cols-[4rem_1fr_1fr_1fr_5rem_auto]"
    : "grid-cols-[4rem_1fr_1fr_1fr_auto]";

  function updateRow(key: string, patch: Partial<LocalRow>) {
    onChange(
      rows.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (patch.entryNumber !== undefined) {
          next.name = "—";
          next.hostel = "—";
        }
        return next;
      }),
    );
  }

  function removeRow(key: string) {
    onChange(rows.filter((r) => r.key !== key));
  }

  function addRow() {
    const nextRank =
      rows.length === 0
        ? 1
        : Math.max(...rows.map((r) => r.rank), 0) + 1;
    onChange([
      ...rows,
      {
        key: nextKey(),
        rank: nextRank,
        entryNumber: "",
        name: "—",
        hostel: "—",
        points: null,
      },
    ]);
  }

  return (
    <div>
      <label className="mb-6 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={usesPoints}
          onChange={(e) => onUsesPointsChange(e.target.checked)}
          className="size-4 accent-accent-deep"
        />
        <span className="text-body text-ink">
          Include a <span className="font-mono text-meta uppercase tracking-[0.12em]">Points</span> column on the public leaderboard
        </span>
      </label>

      <div className="overflow-x-auto border-y border-rule">
        <div
          className={cn(
            "grid min-w-[640px] items-baseline gap-x-4 border-b border-rule px-1 py-3",
            gridCols,
          )}
        >
          <span className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            Rank
          </span>
          <span className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            Entry
          </span>
          <span className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            Name
          </span>
          <span className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            Hostel
          </span>
          {usesPoints && (
            <span className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
              Points
            </span>
          )}
          <span className="sr-only">Remove</span>
        </div>
        <ul className="min-w-[640px]">
          {rows.length === 0 ? (
            <li className="px-1 py-6 text-body text-ink-soft">
              No rows yet. Add one below.
            </li>
          ) : (
            rows.map((row) => (
              <li
                key={row.key}
                className={cn(
                  "grid items-center gap-x-4 border-b border-rule/70 px-1 py-3 last:border-b-0",
                  gridCols,
                )}
              >
                <input
                  type="number"
                  min={1}
                  value={row.rank}
                  onChange={(e) =>
                    updateRow(row.key, {
                      rank: Number.parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full border border-rule bg-cream px-2 py-2 text-body text-ink"
                />
                <input
                  type="text"
                  value={row.entryNumber}
                  placeholder="2024MT60001"
                  onChange={(e) =>
                    updateRow(row.key, {
                      entryNumber: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full border border-rule bg-cream px-2 py-2 font-mono text-meta uppercase tracking-[0.08em] text-ink"
                />
                <span className="text-body text-ink-soft">{row.name}</span>
                <span className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft">
                  {row.hostel}
                </span>
                {usesPoints && (
                  <input
                    type="number"
                    step="any"
                    value={row.points ?? ""}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      updateRow(row.key, {
                        points:
                          raw === "" ? null : Number.parseFloat(raw),
                      });
                    }}
                    className="w-full border border-rule bg-cream px-2 py-2 text-body tabular-nums text-ink"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="font-mono text-meta uppercase tracking-[0.14em] text-warn hover:text-ink"
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {error && (
        <p className="mt-4 text-body text-warn" role="alert">
          {error}
        </p>
      )}

      <p className="mt-4 text-meta text-ink-soft">
        Name and hostel are pulled from csot.devclub.in registrations after you
        save. Toggle points only if your track scores participants numerically.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex h-11 items-center justify-center rounded-full border border-rule px-5 text-meta font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent"
        >
          Add row
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className={cn(
            "inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-meta font-medium uppercase tracking-[0.14em] text-cream transition-transform hover:-translate-y-px",
            saving && "opacity-60",
          )}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
