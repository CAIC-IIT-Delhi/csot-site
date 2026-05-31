"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSupabase } from "@/lib/supabase/server";
import { getTrack } from "@/lib/tracks";
import { registrationInput, type RegistrationInput } from "@/lib/validations";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function registerForTrack(
  raw: RegistrationInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      error: "Finish onboarding before registering for a track.",
    };
  }

  const parsed = registrationInput.safeParse(raw);
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

  const track = getTrack(parsed.data.trackSlug);
  if (!track) return { ok: false, error: "Unknown track." };
  if (track.status !== "open") {
    return { ok: false, error: "Registration is not open for this track yet." };
  }

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("csot_registrations")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("track_slug", parsed.data.trackSlug)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: "You are already registered for this track.",
    };
  }

  const { error } = await supabase.from("csot_registrations").insert(
    {
      user_id: session.user.id,
      track_slug: parsed.data.trackSlug,
      past_experience: parsed.data.pastExperience,
      why_track: parsed.data.whyTrack,
      commitment_hours: parsed.data.commitmentHours,
    },
  );

  if (error) {
    console.error("csot_registrations upsert failed", error);
    return {
      ok: false,
      error: "We could not save your registration. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tracks/${parsed.data.trackSlug}/register`);
  return { ok: true };
}

/**
 * Destructive. The UI must confirm with the user before invoking this.
 * Only deletes the calling user's own row.
 */
export async function withdrawFromTrack(trackSlug: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to sign in first." };
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("csot_registrations")
    .delete()
    .eq("user_id", session.user.id)
    .eq("track_slug", trackSlug);

  if (error) {
    console.error("csot_registrations delete failed", error);
    return { ok: false, error: "We could not withdraw your registration." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tracks/${trackSlug}/register`);
  return { ok: true };
}
