"use client";

import { useMemo, useState } from "react";
import {
  MEDIA_RESPONSE_KEY,
  type AdminParticipantSubmission,
  type SubmissionFormField,
  type SubmissionWeekConfig,
} from "@/lib/track-submissions/types";

type Props = {
  trackSlug: string;
  weeks: SubmissionWeekConfig[];
  submissions: AdminParticipantSubmission[];
};

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function ResponseValue({
  value,
  field,
}: {
  value: string | string[] | undefined;
  field?: SubmissionFormField;
}) {
  if (value === undefined || value === "") {
    return <span className="text-ink-soft">—</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-ink-soft">—</span>;
    return (
      <ul className="space-y-1">
        {value.map((url) => (
          <li key={url}>
            {isUrl(url) ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-ink underline-offset-2 hover:underline"
              >
                {url.split("/").pop() ?? url}
              </a>
            ) : (
              <span>{url}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (field?.type === "url" || field?.type === "file" || isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="break-all text-ink underline-offset-2 hover:underline"
      >
        {field?.type === "file" ? value.split("/").pop() ?? value : value}
      </a>
    );
  }

  if (field?.type === "textarea") {
    return (
      <p className="whitespace-pre-wrap break-words text-body text-ink">{value}</p>
    );
  }

  return <span className="break-words text-body text-ink">{value}</span>;
}

export function TrackSubmissionsViewer({
  weeks,
  submissions,
}: Props) {
  const weekNumbers = useMemo(() => {
    const fromForms = weeks.map((w) => w.week);
    const fromSubs = submissions.map((s) => s.week);
    return [...new Set([...fromForms, ...fromSubs])].sort((a, b) => a - b);
  }, [weeks, submissions]);

  const [selectedWeek, setSelectedWeek] = useState<number>(
    weekNumbers[0] ?? 1,
  );

  const weekConfig = weeks.find((w) => w.week === selectedWeek);
  const weekSubmissions = submissions.filter((s) => s.week === selectedWeek);

  if (weekNumbers.length === 0) {
    return (
      <p className="text-body text-ink-soft">
        No submission forms yet. Add a week under the Forms tab first.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-body text-ink-soft">
          {submissions.length} total submission
          {submissions.length === 1 ? "" : "s"} across all weeks.
        </p>
        <label className="block">
          <span className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            Week
          </span>
          <select
            value={selectedWeek}
            onChange={(e) =>
              setSelectedWeek(Number.parseInt(e.target.value, 10))
            }
            className="mt-1 block border border-rule bg-cream px-3 py-2 text-body text-ink focus:border-accent focus:outline-none"
          >
            {weekNumbers.map((w) => (
              <option key={w} value={w}>
                Week {w}
                {weeks.find((wk) => wk.week === w)?.title
                  ? ` — ${weeks.find((wk) => wk.week === w)?.title}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {weekConfig && (
        <p className="mt-4 text-meta text-ink-soft">
          {weekSubmissions.length} submission
          {weekSubmissions.length === 1 ? "" : "s"} for Week {selectedWeek}
          {weekConfig.title ? `: ${weekConfig.title}` : ""}
        </p>
      )}

      {weekSubmissions.length === 0 ? (
        <p className="mt-8 text-body text-ink-soft">
          No submissions for Week {selectedWeek} yet.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {weekSubmissions.map((row) => (
            <article
              key={`${row.week}-${row.entryNumber}-${row.updatedAt}`}
              className="border border-rule bg-paper/40 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <p className="font-mono text-meta uppercase tracking-[0.14em] text-accent-deep">
                    {row.entryNumber}
                  </p>
                  <p className="serif mt-1 text-body text-ink">{row.name}</p>
                  <p className="mt-1 font-mono text-meta uppercase tracking-[0.12em] text-ink-soft">
                    {row.hostel}
                  </p>
                </div>
                <p className="text-meta text-ink-soft">
                  Updated{" "}
                  {new Date(row.updatedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <dl className="mt-4 space-y-4">
                {(weekConfig?.fields ?? []).map((field) => (
                  <div key={field.id}>
                    <dt className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
                      {field.label}
                    </dt>
                    <dd className="mt-1">
                      <ResponseValue
                        value={row.responses[field.id]}
                        field={field}
                      />
                    </dd>
                  </div>
                ))}

                {!weekConfig &&
                  Object.entries(row.responses).map(([key, value]) => (
                    <div key={key}>
                      <dt className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
                        {key === MEDIA_RESPONSE_KEY ? "Media (legacy)" : key}
                      </dt>
                      <dd className="mt-1">
                        <ResponseValue value={value} />
                      </dd>
                    </div>
                  ))}
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
