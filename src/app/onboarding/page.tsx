import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { OnboardingForm } from "@/components/onboarding-form";
import { getSupabase } from "@/lib/supabase/server";
import { entryYearFromEntryNumber } from "@/lib/year-from-entry";
import type { EntryYear } from "@/lib/validations";
import type { Hostel } from "@/lib/hostels";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

function safeNext(raw?: string): string {
  if (!raw) return "/dashboard";
  // Only allow internal paths, never external redirects.
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export default async function OnboardingPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/onboarding");

  const { next } = await searchParams;
  const nextPath = safeNext(next);
  const isFirstTime = !session.user.onboarded;

  let profileLocked = false;
  if (session.user.id) {
    const supabase = getSupabase();
    const { count } = await supabase
      .from("csot_registrations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id);
    profileLocked = (count ?? 0) > 0;
  }

  const profile = {
    hostel: ((session.user.hostel as Hostel | null) ?? "") as Hostel | "",
    entryYear:
      (session.user.entryYear as EntryYear | null) ??
      entryYearFromEntryNumber(session.user.entryNumber),
    phone: session.user.phone ?? "",
  };

  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <div className="mx-auto max-w-[640px] px-6 py-16 md:px-10 md:py-24">
          <p className="font-mono text-meta uppercase tracking-[0.22em] text-accent-deep">
            {isFirstTime ? "One-time setup" : "Your profile"}
          </p>
          <h1 className="serif mt-3 text-h1 text-ink">
            {isFirstTime
              ? "A few details, then you are in."
              : profileLocked
                ? "Your profile"
                : "Update your details."}
          </h1>
          <p className="mt-5 max-w-[52ch] text-body-lg text-ink-soft">
            {isFirstTime
              ? "We ask these once so you do not have to fill them again for every track. Hostel, year, and a contact number — that is it."
              : profileLocked
                ? "Hostel, year, and phone are locked once you register for a track."
                : "Hostel, year, and phone are shared across every track you register for."}
          </p>

          <div className="mt-10 border-t border-rule pt-10">
            <ProfileSummary
              name={session.user.name ?? null}
              email={session.user.email ?? null}
              entryNumber={session.user.entryNumber}
              department={session.user.department}
            />
          </div>

          <div className="mt-10">
            {profileLocked ? (
              <LockedProfileDetails profile={profile} nextPath={nextPath} />
            ) : (
              <OnboardingForm
                isFirstTime={isFirstTime}
                nextPath={nextPath}
                initial={profile}
              />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function LockedProfileDetails({
  profile,
  nextPath,
}: {
  profile: {
    hostel: Hostel | "";
    entryYear: EntryYear | null;
    phone: string;
  };
  nextPath: string;
}) {
  return (
    <div className="flex flex-col gap-7">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Hostel" value={profile.hostel || "—"} />
        <Field
          label="Entry year"
          value={profile.entryYear ? String(profile.entryYear) : "—"}
          mono
        />
        <Field label="Phone" value={profile.phone || "—"} mono />
      </div>
      <p className="text-body text-ink-soft">
        These were saved when you registered. If something is wrong, reach out to
        the organisers — they can fix it on their end.
      </p>
      <Link
        href={nextPath}
        className="inline-flex h-12 w-fit items-center justify-center rounded-full bg-ink px-7 text-body font-medium text-cream transition-transform hover:-translate-y-px"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

function ProfileSummary({
  name,
  email,
  entryNumber,
  department,
}: {
  name: string | null;
  email: string | null;
  entryNumber: string | null;
  department: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Name" value={name ?? "—"} />
      <Field label="Entry number" value={entryNumber ?? "—"} mono />
      <Field label="Department" value={department ?? "—"} />
      <Field label="Email" value={email ?? "—"} />
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
        {label}
      </p>
      <p
        className={
          mono ? "mt-1 font-mono text-[0.95rem] text-ink" : "mt-1 text-body text-ink"
        }
      >
        {value}
      </p>
    </div>
  );
}
