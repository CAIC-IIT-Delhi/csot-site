"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Track } from "@/lib/tracks";
import type {
  AdminParticipantSubmission,
  SubmissionFormField,
  SubmissionWeekConfig,
  TrackDriveConnection,
} from "@/lib/track-submissions/types";
import { submissionWeekPath } from "@/lib/track-submissions/paths";
import { cn } from "@/lib/utils";
import {
  loginLeaderboardEditor,
  logoutLeaderboardEditor,
  type EditorRow,
} from "@/app/actions/leaderboard-editor";
import {
  deleteTrackSubmissionWeek,
  saveTrackSubmissionWeek,
} from "@/app/actions/track-admin";
import { LeaderboardEditor } from "@/components/leaderboard-editor";
import { SubmissionFieldsEditor } from "@/components/submission-fields-editor";
import { defaultSubmissionFields } from "@/lib/track-submissions/fields";
import { TrackSubmissionsViewer } from "@/components/track-submissions-viewer";

type Tab = "leaderboard" | "submissions" | "responses";

type Props = {
  track: Track;
  authenticated: boolean;
  initialRows: EditorRow[];
  initialUsesPoints: boolean;
  initialWeeks: SubmissionWeekConfig[];
  initialSubmissions: AdminParticipantSubmission[];
  initialDriveConnection: TrackDriveConnection;
};

const EMPTY_WEEK = {
  week: 1,
  title: "",
  description: "",
  instructionsUrl: "",
  fields: defaultSubmissionFields() as SubmissionFormField[],
  isOpen: true,
};

export function TrackAdminPanel({
  track,
  authenticated: initialAuthenticated,
  initialRows,
  initialUsesPoints,
  initialWeeks,
  initialSubmissions,
  initialDriveConnection,
}: Props) {
  const router = useRouter();
  const promptedRef = useRef(false);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [loginMessage, setLoginMessage] = useState<string>();
  const [editingWeek, setEditingWeek] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_WEEK);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();

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
    router.refresh();
  }, [track.slug, router]);

  async function handleSignOut() {
    await logoutLeaderboardEditor();
    setAuthenticated(false);
    setLoginMessage("Signed out.");
    router.refresh();
  }

  useEffect(() => {
    if (initialAuthenticated || promptedRef.current) return;
    promptedRef.current = true;
    void handleSignIn();
  }, [initialAuthenticated, handleSignIn]);

  function openNewWeekForm() {
    const nextWeek =
      initialWeeks.length === 0
        ? 1
        : Math.max(...initialWeeks.map((w) => w.week)) + 1;
    setForm({
      ...EMPTY_WEEK,
      week: nextWeek,
      fields: defaultSubmissionFields(),
    });
    setEditingWeek("new");
    setFormError(undefined);
  }

  function openEditWeekForm(week: SubmissionWeekConfig) {
    setForm({
      week: week.week,
      title: week.title,
      description: week.description ?? "",
      instructionsUrl: week.instructionsUrl ?? "",
      fields: week.fields,
      isOpen: week.isOpen,
    });
    setEditingWeek(week.week);
    setFormError(undefined);
  }

  async function handleSaveWeek(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(undefined);
    const result = await saveTrackSubmissionWeek({
      trackSlug: track.slug,
      ...form,
    });
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setEditingWeek(null);
    router.refresh();
  }

  async function handleDeleteWeek(week: number) {
    if (
      !window.confirm(
        `Remove the Week ${week} submission form? Existing participant submissions are kept.`,
      )
    ) {
      return;
    }
    const result = await deleteTrackSubmissionWeek(track.slug, week);
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    if (editingWeek === week) setEditingWeek(null);
    router.refresh();
  }

  if (!authenticated) {
    return (
      <div className="border border-rule bg-paper/60 p-8">
        <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
          Track admin
        </p>
        <p className="serif mt-3 text-h3 text-ink">
          {loginMessage ?? "Sign in to manage this track."}
        </p>
        <p className="mt-3 text-body text-ink-soft">
          Use the track-lead credentials shared by organisers. Same login as
          the leaderboard editor.
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4">
        <div className="flex gap-1">
          <TabButton
            active={tab === "leaderboard"}
            onClick={() => setTab("leaderboard")}
          >
            Leaderboard
          </TabButton>
          <TabButton
            active={tab === "submissions"}
            onClick={() => setTab("submissions")}
          >
            Forms
          </TabButton>
          <TabButton
            active={tab === "responses"}
            onClick={() => setTab("responses")}
          >
            Submissions
          </TabButton>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8">
        {tab === "leaderboard" ? (
          <LeaderboardEditor
            track={track}
            authenticated
            initialRows={initialRows}
            initialUsesPoints={initialUsesPoints}
            embedded
          />
        ) : tab === "submissions" ? (
          <SubmissionsPanel
            trackSlug={track.slug}
            weeks={initialWeeks}
            driveConnection={initialDriveConnection}
            editingWeek={editingWeek}
            form={form}
            saving={saving}
            formError={formError}
            onFormChange={setForm}
            onOpenNew={openNewWeekForm}
            onOpenEdit={openEditWeekForm}
            onCancelEdit={() => setEditingWeek(null)}
            onSave={(e) => void handleSaveWeek(e)}
            onDelete={(week) => void handleDeleteWeek(week)}
          />
        ) : (
          <TrackSubmissionsViewer
            trackSlug={track.slug}
            weeks={initialWeeks}
            submissions={initialSubmissions}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 font-mono text-meta uppercase tracking-[0.14em] transition-colors",
        active
          ? "bg-ink text-cream"
          : "text-ink-soft hover:bg-paper hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function SubmissionsPanel({
  trackSlug,
  weeks,
  driveConnection,
  editingWeek,
  form,
  saving,
  formError,
  onFormChange,
  onOpenNew,
  onOpenEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  trackSlug: string;
  weeks: SubmissionWeekConfig[];
  driveConnection: TrackDriveConnection;
  editingWeek: number | "new" | null;
  form: typeof EMPTY_WEEK;
  saving: boolean;
  formError?: string;
  onFormChange: (next: typeof EMPTY_WEEK) => void;
  onOpenNew: () => void;
  onOpenEdit: (week: SubmissionWeekConfig) => void;
  onCancelEdit: () => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: (week: number) => void;
}) {
  const router = useRouter();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-body text-ink-soft">
          Configure custom fields for each week. File fields upload to Google
          Drive.
        </p>
        <button
          type="button"
          onClick={onOpenNew}
          className="inline-flex h-10 items-center justify-center rounded-full border border-rule px-4 text-meta font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent"
        >
          Add week
        </button>
      </div>

      {weeks.length === 0 ? (
        <p className="mt-8 text-body text-ink-soft">
          No submission forms yet. Add Week 1 when the first project drops.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {weeks.map((week) => (
            <li
              key={week.week}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-meta uppercase tracking-[0.16em] text-accent-deep">
                  Week {week.week}
                  {!week.isOpen && (
                    <span className="ml-2 text-warn">· closed</span>
                  )}
                </p>
                <p className="serif mt-1 text-body text-ink">{week.title}</p>
                <p className="mt-1 text-meta text-ink-soft">
                  {week.fields.length} field{week.fields.length === 1 ? "" : "s"}
                  {" · "}
                  {week.submissionCount ?? 0} submission
                  {(week.submissionCount ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={submissionWeekPath(trackSlug, week.week)}
                  className="text-meta uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
                >
                  Public form ↗
                </Link>
                <button
                  type="button"
                  onClick={() => onOpenEdit(week)}
                  className="text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(week.week)}
                  className="text-meta uppercase tracking-[0.14em] text-warn hover:text-ink"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingWeek !== null && (
        <form
          onSubmit={onSave}
          className="mt-10 border border-rule bg-paper/40 p-6"
        >
          <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            {editingWeek === "new" ? "New submission form" : `Edit Week ${editingWeek}`}
          </p>

          <div className="mt-6 grid gap-5">
            <AdminField label="Week number">
              <input
                type="number"
                min={1}
                max={52}
                required
                disabled={editingWeek !== "new"}
                value={form.week}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    week: Number.parseInt(e.target.value, 10) || 1,
                  })
                }
                className={adminInputCls}
              />
            </AdminField>

            <AdminField label="Title">
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) =>
                  onFormChange({ ...form, title: e.target.value })
                }
                className={adminInputCls}
              />
            </AdminField>

            <AdminField label="Description (sidebar copy)">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  onFormChange({ ...form, description: e.target.value })
                }
                className={adminInputCls}
              />
            </AdminField>

            <AdminField label="Instructions URL (optional)">
              <input
                type="url"
                value={form.instructionsUrl}
                onChange={(e) =>
                  onFormChange({ ...form, instructionsUrl: e.target.value })
                }
                placeholder="https://github.com/..."
                className={adminInputCls}
              />
            </AdminField>

            <SubmissionFieldsEditor
              fields={form.fields}
              onChange={(fields) => onFormChange({ ...form, fields })}
              showDriveConnect={form.fields.some((f) => f.type === "file")}
              driveConnection={driveConnection}
              trackSlug={trackSlug}
              onDriveConnectionChange={() => router.refresh()}
            />

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.isOpen}
                onChange={(e) =>
                  onFormChange({ ...form, isOpen: e.target.checked })
                }
                className="size-4 accent-accent-deep"
              />
              <span className="text-body text-ink">Open for submissions</span>
            </label>
          </div>

          {formError && (
            <p className="mt-4 text-meta text-accent-deep" role="alert">
              {formError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-meta font-medium uppercase tracking-[0.14em] text-cream transition-transform hover:-translate-y-px",
                saving && "opacity-60",
              )}
            >
              {saving ? "Saving…" : "Save form"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function AdminField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const adminInputCls =
  "w-full border border-rule bg-cream px-3 py-2 text-body text-ink focus:border-accent focus:outline-none";
