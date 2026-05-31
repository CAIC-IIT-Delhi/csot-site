"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registrationInput, type RegistrationInput } from "@/lib/validations";
import { registerForTrack } from "@/app/actions/registrations";
import { cn } from "@/lib/utils";

type FormInitial = Omit<RegistrationInput, "trackSlug">;

type Props = {
  trackSlug: string;
  user: {
    name: string;
    email: string;
    kerberos: string;
    entryNumber: string | null;
    department: string | null;
    hostel: string | null;
    entryYear: number | null;
    phone: string | null;
  };
  initial: FormInitial;
  submitLabel: string;
  /** Hide profile edit link once the user has registered for any track. */
  profileLocked?: boolean;
};

export function RegistrationForm({
  trackSlug,
  user,
  initial,
  submitLabel,
  profileLocked = false,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationInput),
    defaultValues: { trackSlug, ...initial },
  });

  function onSubmit(values: RegistrationInput) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await registerForTrack({ ...values, trackSlug });
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      setSuccess(true);
      reset(values);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-7"
      noValidate
    >
      <section>
        <p className="font-mono text-meta uppercase tracking-[0.18em] text-ink-soft">
          On file
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Name" value={user.name || "—"} />
          <Field label="Entry number" value={user.entryNumber || "—"} mono />
          <Field label="Department" value={user.department || "—"} />
          <Field label="Email" value={user.email || "—"} />
          <Field label="Hostel" value={user.hostel || "—"} />
          <Field
            label="Entry year"
            value={user.entryYear ? String(user.entryYear) : "—"}
            mono
          />
          <Field label="Phone" value={user.phone || "—"} mono />
        </div>
        <p className="text-meta text-ink-soft mt-4">
          {profileLocked
            ? "From your profile. Locked after your first registration."
            : (
              <>
                From your profile. <EditLink /> to change hostel, entry year, or
                phone.
              </>
            )}
        </p>
      </section>

      <div className="mt-4 border-t border-rule pt-7">
        <Label htmlFor="pastExperience">
          What have you done that is even loosely relevant?
        </Label>
        <textarea
          id="pastExperience"
          rows={4}
          placeholder="Anything counts. Coursework, a hackathon, a YouTube tutorial you actually finished, a side project. 'Nothing yet' is also a valid answer if you write a sentence about why you are curious."
          className={inputCls(!!errors.pastExperience)}
          {...register("pastExperience")}
        />
        <FieldError msg={errors.pastExperience?.message} />
      </div>

      <div>
        <Label htmlFor="whyTrack">Why this track?</Label>
        <textarea
          id="whyTrack"
          rows={3}
          placeholder="A line or two. We use this to scope mentor support, not to filter people out."
          className={inputCls(!!errors.whyTrack)}
          {...register("whyTrack")}
        />
        <FieldError msg={errors.whyTrack?.message} />
      </div>

      <div>
        <Label htmlFor="commitmentHours">Hours per week you can give</Label>
        <input
          id="commitmentHours"
          type="number"
          min={1}
          max={40}
          step={1}
          className={inputCls(!!errors.commitmentHours)}
          {...register("commitmentHours", { valueAsNumber: true })}
        />
        <p className="text-meta text-ink-soft mt-1">
          Be honest. 4 to 8 is typical for a fresher.
        </p>
        <FieldError msg={errors.commitmentHours?.message} />
      </div>

      <input type="hidden" {...register("trackSlug")} value={trackSlug} />

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
          Saved.
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
          {isPending ? "Saving…" : submitLabel}
        </button>
        <Link
          href="/#tracks"
          className="font-mono text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function EditLink() {
  return (
    <Link
      href="/onboarding"
      className="underline decoration-accent/60 underline-offset-2 hover:text-ink"
    >
      Edit profile
    </Link>
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
        className={cn(
          "mt-1 text-body text-ink",
          mono && "font-mono text-[0.95rem]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
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
