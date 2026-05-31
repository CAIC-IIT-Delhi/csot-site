import { ENTRY_YEARS, type EntryYear } from "@/lib/validations";

/**
 * IIT Delhi entry numbers look like "2024CS10123" — the first 4 digits are
 * the admission year. Returns that year if it falls inside the accepted
 * range, otherwise null (we default the dropdown to unset rather than
 * guessing wrong).
 */
export function entryYearFromEntryNumber(
  entryNumber: string | null | undefined,
): EntryYear | null {
  if (!entryNumber) return null;
  const m = entryNumber.match(/^(\d{4})/);
  if (!m) return null;
  const admit = Number(m[1]);
  if (!Number.isFinite(admit)) return null;
  if ((ENTRY_YEARS as readonly number[]).includes(admit)) {
    return admit as EntryYear;
  }
  return null;
}
