import { getSupabase } from "@/lib/supabase/server";

export type ResolvedUser = {
  name: string;
  hostel: string;
};

/**
 * Batch-resolve entry numbers to name + hostel from csot_users.
 * Missing users get "—" for both fields.
 */
export async function resolveUsersByEntry(
  entryNumbers: string[],
): Promise<Map<string, ResolvedUser>> {
  const keys = Array.from(
    new Set(
      entryNumbers
        .map((e) => e.trim().toUpperCase())
        .filter((e): e is string => Boolean(e)),
    ),
  );

  const out = new Map<string, ResolvedUser>();
  if (keys.length === 0) return out;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("csot_users")
    .select("entry_number, name, hostel")
    .in("entry_number", keys);

  if (error) {
    throw new Error(`csot_users lookup failed: ${error.message}`);
  }

  for (const row of data ?? []) {
    const key = (row.entry_number as string | null)?.trim().toUpperCase();
    if (!key) continue;
    const name = (row.name as string | null)?.trim() || "—";
    const hostel = (row.hostel as string | null)?.trim() || "—";
    out.set(key, { name, hostel });
  }

  return out;
}

export function lookupResolved(
  map: Map<string, ResolvedUser>,
  entryNumber: string,
): ResolvedUser {
  const key = entryNumber.trim().toUpperCase();
  return map.get(key) ?? { name: "—", hostel: "—" };
}
