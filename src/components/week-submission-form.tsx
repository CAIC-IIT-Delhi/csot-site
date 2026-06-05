"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  prepareTrackWeekDriveUploads,
} from "@/app/actions/google-drive";
import { submitTrackWeekForm } from "@/app/actions/track-submissions";
import { uploadFileToDriveResumable } from "@/lib/track-submissions/drive-upload-client";
import {
  participantDriveFolderUrl,
  participantFolderName,
} from "@/lib/track-submissions/drive-client";
import type {
  SubmissionFormField,
  SubmissionResponses,
  SubmissionWeekConfig,
} from "@/lib/track-submissions/types";
import { cn } from "@/lib/utils";

type Props = {
  config: SubmissionWeekConfig;
  participant: { entryNumber: string; name: string };
  initialResponses: SubmissionResponses;
  hasExistingSubmission: boolean;
};

function stringValue(responses: SubmissionResponses, key: string): string {
  const v = responses[key];
  return typeof v === "string" ? v : "";
}

export function WeekSubmissionForm({
  config,
  participant,
  initialResponses,
  hasExistingSubmission,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of config.fields) {
      if (field.type !== "file") {
        init[field.id] = stringValue(initialResponses, field.id);
      }
    }
    return init;
  });
  const [keptFiles, setKeptFiles] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of config.fields) {
      if (field.type === "file") {
        init[field.id] = stringValue(initialResponses, field.id);
      }
    }
    return init;
  });
  const [pendingFiles, setPendingFiles] = useState<Record<string, File | null>>(
    {},
  );

  const participantFolder = participantFolderName(
    participant.entryNumber,
    participant.name,
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});
    setSuccess(false);
    setUploadProgress(null);

    startTransition(async () => {
      const fileFields = config.fields.filter((f) => f.type === "file");
      const uploadsNeeded = fileFields.filter((field) => {
        const pending = pendingFiles[field.id];
        return pending && pending.size > 0;
      });

      const uploadedUrls: Record<string, string> = {};

      if (uploadsNeeded.length > 0) {
        setUploadProgress("Preparing Google Drive upload…");
        const prepared = await prepareTrackWeekDriveUploads({
          trackSlug: config.trackSlug,
          week: config.week,
          uploads: uploadsNeeded.map((field) => ({
            fieldId: field.id,
            driveFolderUrl: field.driveFolderUrl?.trim() ?? "",
          })),
        });

        if (!prepared.ok) {
          setServerError(prepared.error);
          setUploadProgress(null);
          return;
        }

        for (const field of uploadsNeeded) {
          const file = pendingFiles[field.id];
          const target = prepared.targets[field.id];
          if (!file || !target) continue;

          setUploadProgress(`Uploading ${file.name} to Google Drive…`);
          try {
            uploadedUrls[field.id] = await uploadFileToDriveResumable(
              prepared.accessToken,
              target.parentFolderId,
              file,
            );
          } catch (err) {
            setServerError(
              err instanceof Error ? err.message : "Drive upload failed.",
            );
            setFieldErrors((prev) => ({
              ...prev,
              [field.id]: "Upload failed.",
            }));
            setUploadProgress(null);
            return;
          }
        }
      }

      setUploadProgress("Saving submission…");

      const formData = new FormData();
      formData.set("trackSlug", config.trackSlug);
      formData.set("week", String(config.week));

      for (const field of config.fields) {
        if (field.type === "file") {
          const url = uploadedUrls[field.id] ?? keptFiles[field.id] ?? "";
          if (url) formData.set(`field_${field.id}`, url);
          continue;
        }
        const value = textValues[field.id] ?? "";
        if (value) formData.set(`field_${field.id}`, value);
      }

      const res = await submitTrackWeekForm(formData);
      setUploadProgress(null);

      if (!res.ok) {
        setServerError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      setSuccess(true);
      setPendingFiles({});
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-col gap-7"
      noValidate
    >
      {config.fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          participant={participant}
          participantFolder={participantFolder}
          textValue={textValues[field.id] ?? ""}
          onTextChange={(v) =>
            setTextValues((prev) => ({ ...prev, [field.id]: v }))
          }
          keptFileUrl={keptFiles[field.id]}
          pendingFile={pendingFiles[field.id] ?? null}
          onPendingFileChange={(file) =>
            setPendingFiles((prev) => ({ ...prev, [field.id]: file }))
          }
          onClearKeptFile={() =>
            setKeptFiles((prev) => ({ ...prev, [field.id]: "" }))
          }
          error={fieldErrors[field.id]}
        />
      ))}

      {uploadProgress && (
        <p className="text-meta text-ink-soft" role="status">
          {uploadProgress}
        </p>
      )}

      {serverError && (
        <div
          role="alert"
          className="border border-accent/40 bg-accent-soft/60 px-4 py-3 text-meta text-accent-deep"
        >
          {serverError}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="border border-success/40 bg-paper px-4 py-3 text-meta text-success"
        >
          {hasExistingSubmission ? "Submission updated." : "Submission saved."}
        </div>
      )}

      <div className="mt-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex h-12 items-center justify-center rounded-full bg-ink px-7 text-body font-medium text-cream transition-transform",
            isPending ? "opacity-60" : "hover:-translate-y-px",
          )}
        >
          {isPending
            ? uploadProgress ?? "Saving…"
            : hasExistingSubmission
              ? "Update submission"
              : `Submit Week ${config.week}`}
        </button>
        <Link
          href={`/tracks/${config.trackSlug}/register`}
          className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
        >
          Back to track
        </Link>
      </div>
    </form>
  );
}

function FieldInput({
  field,
  participant,
  participantFolder,
  textValue,
  onTextChange,
  keptFileUrl,
  pendingFile,
  onPendingFileChange,
  onClearKeptFile,
  error,
}: {
  field: SubmissionFormField;
  participant: { entryNumber: string; name: string };
  participantFolder: string;
  textValue: string;
  onTextChange: (v: string) => void;
  keptFileUrl?: string;
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  onClearKeptFile: () => void;
  error?: string;
}) {
  if (field.type === "file") {
    const browseUrl =
      field.driveFolderUrl?.trim() &&
      participantDriveFolderUrl(
        field.driveFolderUrl,
        participant.entryNumber,
        participant.name,
      );

    return (
      <div>
        <Label>{field.label}</Label>
        <p className="mt-2 text-meta text-ink-soft">
          Uploads go directly to Google Drive in{" "}
          <span className="font-mono">{participantFolder}/</span>
        </p>
        {browseUrl && (
          <a
            href={browseUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-meta uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
          >
            Open your folder ↗
          </a>
        )}
        {keptFileUrl && !pendingFile && (
          <div className="mt-3 flex items-center justify-between gap-3 text-meta text-ink-soft">
            <a
              href={keptFileUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate underline-offset-2 hover:underline"
            >
              {keptFileUrl.split("/").pop()}
            </a>
            <button
              type="button"
              onClick={onClearKeptFile}
              className="shrink-0 text-warn hover:text-ink"
            >
              Remove
            </button>
          </div>
        )}
        {pendingFile && (
          <p className="mt-3 text-meta text-ink">
            Selected: {pendingFile.name}
            <button
              type="button"
              onClick={() => onPendingFileChange(null)}
              className="ml-3 text-warn hover:text-ink"
            >
              Clear
            </button>
          </p>
        )}
        <input
          type="file"
          accept={field.accept || undefined}
          onChange={(e) =>
            onPendingFileChange(e.target.files?.[0] ?? null)
          }
          className="mt-3 block w-full text-body text-ink file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-meta file:font-medium file:uppercase file:tracking-[0.12em] file:text-cream"
        />
        {field.hint && (
          <p className="text-meta text-ink-soft mt-1">{field.hint}</p>
        )}
        <FieldError msg={error} />
      </div>
    );
  }

  const shared = {
    id: field.id,
    name: `field_${field.id}`,
    required: field.required,
    value: textValue,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onTextChange(e.target.value),
    className: inputCls(!!error),
  };

  return (
    <div>
      <Label htmlFor={field.id}>{field.label}</Label>
      {field.type === "textarea" ? (
        <textarea rows={4} {...shared} />
      ) : (
        <input
          type={field.type === "url" ? "url" : "text"}
          inputMode={field.type === "url" ? "url" : undefined}
          placeholder={
            field.type === "url"
              ? "https://github.com/your-user/your-repo/..."
              : undefined
          }
          {...shared}
        />
      )}
      {field.hint && (
        <p className="text-meta text-ink-soft mt-1">{field.hint}</p>
      )}
      <FieldError msg={error} />
    </div>
  );
}

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-mono text-meta uppercase tracking-[0.16em] text-ink-soft"
    >
      {children}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-2 text-meta text-accent-deep">{msg}</p>;
}

function inputCls(hasError: boolean) {
  return cn(
    "mt-2 w-full border-0 border-b border-rule bg-transparent py-2 text-body text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none",
    hasError && "border-accent",
  );
}
