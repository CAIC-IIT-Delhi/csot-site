"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabase } from "@/lib/supabase/server";
import { onboardingInput, type OnboardingInput } from "@/lib/validations";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Creates the csot_users row on first run and updates it on subsequent
 * edits. The row is keyed by kerberos (unique). We deliberately do this
 * here and not in the Auth.js signIn callback so that visitors who bounce
 * off the OAuth screen do not leave behind ghost rows.
 */
export async function completeOnboarding(
  raw: OnboardingInput,
): Promise<ActionResult> {
  const session = await auth();
  const kerberos = session?.user?.kerberos;
  if (!kerberos) {
    return { ok: false, error: "You need to sign in first." };
  }

  const parsed = onboardingInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = getSupabase();

  if (session?.user?.id) {
    const { count } = await supabase
      .from("csot_registrations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error:
          "Profile details cannot be changed after you register for a track.",
      };
    }
  }

  const { error } = await supabase.from("csot_users").upsert(
    {
      kerberos,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      entry_number: session.user.entryNumber ?? null,
      department: session.user.department ?? null,
      hostel: parsed.data.hostel,
      entry_year: parsed.data.entryYear,
      phone: parsed.data.phone,
      onboarded_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "kerberos" },
  );

  if (error) {
    console.error("csot_users onboarding upsert failed", error);
    return {
      ok: false,
      error: "We could not save your details. Please try again.",
    };
  }

  // Invalidate anything that gates on onboarded state.
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { ok: true };
}
