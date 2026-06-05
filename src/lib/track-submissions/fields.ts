import type { SubmissionFormField } from "@/lib/track-submissions/types";

export function generateFieldId(): string {
  return `field_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function defaultSubmissionFields(): SubmissionFormField[] {
  return [
    {
      id: "part1",
      type: "url",
      label: "GitHub link",
      required: true,
      githubOnly: true,
    },
  ];
}

export function normalizeSubmissionFields(
  raw: unknown,
): SubmissionFormField[] {
  if (!Array.isArray(raw)) return defaultSubmissionFields();

  const fields: SubmissionFormField[] = [];
  const ids = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const type = row.type;
    if (
      type !== "text" &&
      type !== "textarea" &&
      type !== "url" &&
      type !== "file"
    ) {
      continue;
    }

    let id = typeof row.id === "string" ? row.id.trim() : "";
    if (!id || ids.has(id)) id = generateFieldId();
    ids.add(id);

    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!label) continue;

    fields.push({
      id,
      type,
      label: label.slice(0, 160),
      hint:
        typeof row.hint === "string" && row.hint.trim()
          ? row.hint.trim().slice(0, 500)
          : undefined,
      required: row.required !== false,
      githubOnly: type === "url" ? row.githubOnly === true : undefined,
      accept:
        type === "file" && typeof row.accept === "string"
          ? row.accept.trim().slice(0, 120)
          : undefined,
      driveFolderUrl:
        type === "file" && typeof row.driveFolderUrl === "string"
          ? row.driveFolderUrl.trim().slice(0, 500)
          : undefined,
    });
  }

  return fields.length > 0 ? fields : defaultSubmissionFields();
}
