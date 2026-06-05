"use client";

import type { SubmissionFormField, SubmissionFieldType } from "@/lib/track-submissions/types";
import { DRIVE_FOLDER_SETUP_STEPS } from "@/lib/track-submissions/types";
import { generateFieldId } from "@/lib/track-submissions/fields";
import { TrackGoogleDriveConnect } from "@/components/track-google-drive-connect";
import type { TrackDriveConnection } from "@/lib/track-submissions/types";
import { cn } from "@/lib/utils";

const FIELD_TYPES: { value: SubmissionFieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "url", label: "URL / link" },
  { value: "file", label: "File upload" },
];

type Props = {
  fields: SubmissionFormField[];
  onChange: (fields: SubmissionFormField[]) => void;
  showDriveConnect?: boolean;
  driveConnection?: TrackDriveConnection;
  trackSlug?: string;
  onDriveConnectionChange?: () => void;
};

export function SubmissionFieldsEditor({
  fields,
  onChange,
  showDriveConnect,
  driveConnection,
  trackSlug,
  onDriveConnectionChange,
}: Props) {
  function updateField(index: number, patch: Partial<SubmissionFormField>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    if (fields.length <= 1) return;
    onChange(fields.filter((_, i) => i !== index));
  }

  function addField() {
    onChange([
      ...fields,
      {
        id: generateFieldId(),
        type: "text",
        label: "New field",
        required: true,
      },
    ]);
  }

  function moveField(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= fields.length) return;
    const copy = [...fields];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
          Form fields
        </p>
        <button
          type="button"
          onClick={addField}
          className="font-mono text-meta uppercase tracking-[0.14em] text-accent-deep hover:text-ink"
        >
          + Add field
        </button>
      </div>

      {showDriveConnect && driveConnection && trackSlug && (
        <TrackGoogleDriveConnect
          trackSlug={trackSlug}
          connection={driveConnection}
          onConnectionChange={onDriveConnectionChange}
        />
      )}

      <ul className="space-y-4">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="border border-rule bg-cream/50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft">
                Field {index + 1}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveField(index, -1)}
                  className="text-meta text-ink-soft hover:text-ink disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === fields.length - 1}
                  onClick={() => moveField(index, 1)}
                  className="text-meta text-ink-soft hover:text-ink disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={fields.length <= 1}
                  onClick={() => removeField(index)}
                  className="text-meta text-warn hover:text-ink disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft">
                  Label
                </span>
                <input
                  type="text"
                  required
                  value={field.label}
                  onChange={(e) =>
                    updateField(index, { label: e.target.value })
                  }
                  className={inputCls}
                />
              </label>

              <label className="block">
                <span className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft">
                  Type
                </span>
                <select
                  value={field.type}
                  onChange={(e) => {
                    const type = e.target.value as SubmissionFieldType;
                    updateField(index, {
                      type,
                      githubOnly: type === "url" ? field.githubOnly : undefined,
                      accept: type === "file" ? field.accept : undefined,
                      driveFolderUrl:
                        type === "file" ? field.driveFolderUrl : undefined,
                    });
                  }}
                  className={inputCls}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex cursor-pointer items-center gap-2 self-end pb-2">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField(index, { required: e.target.checked })
                  }
                  className="size-4 accent-accent-deep"
                />
                <span className="text-body text-ink">Required</span>
              </label>

              <label className="block sm:col-span-2">
                <span className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft">
                  Hint (optional)
                </span>
                <input
                  type="text"
                  value={field.hint ?? ""}
                  onChange={(e) =>
                    updateField(index, { hint: e.target.value })
                  }
                  className={inputCls}
                />
              </label>

              {field.type === "url" && (
                <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={field.githubOnly ?? false}
                    onChange={(e) =>
                      updateField(index, { githubOnly: e.target.checked })
                    }
                    className="size-4 accent-accent-deep"
                  />
                  <span className="text-body text-ink">
                    GitHub links only
                  </span>
                </label>
              )}

              {field.type === "file" && (
                <>
                  <label className="block sm:col-span-2">
                    <span className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft">
                      Accepted types (optional)
                    </span>
                    <input
                      type="text"
                      value={field.accept ?? ""}
                      placeholder="image/*,video/*,.pdf"
                      onChange={(e) =>
                        updateField(index, { accept: e.target.value })
                      }
                      className={inputCls}
                    />
                  </label>

                  <div className="sm:col-span-2 border border-rule bg-accent-soft/30 p-4">
                    <p className="font-mono text-meta uppercase tracking-[0.14em] text-accent-deep">
                      Google Drive folder
                    </p>
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-meta text-ink-soft">
                      {DRIVE_FOLDER_SETUP_STEPS.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <label className="mt-4 block">
                      <span className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft">
                        Folder link
                      </span>
                      <input
                        type="url"
                        required
                        value={field.driveFolderUrl ?? ""}
                        placeholder="https://drive.google.com/drive/folders/..."
                        onChange={(e) =>
                          updateField(index, {
                            driveFolderUrl: e.target.value,
                          })
                        }
                        className={inputCls}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const inputCls = cn(
  "mt-1 w-full border border-rule bg-cream px-3 py-2 text-body text-ink focus:border-accent focus:outline-none",
);
