"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  ENTRY_YEARS,
  onboardingInput,
  type EntryYear,
  type OnboardingInput,
} from "@/lib/validations";
import { completeOnboarding } from "@/app/actions/onboarding";
import { type Hostel } from "@/lib/hostels";
import { HostelSelect } from "@/components/hostel-select";
import { cn } from "@/lib/utils";

type FormInitial = {
  hostel: Hostel | "";
  entryYear: EntryYear | null;
  phone: string;
};

type Props = {
  initial: FormInitial;
  /** Where to send the user after a successful save. */
  nextPath: string;
  /** True for first run, false when editing details later. */
  isFirstTime: boolean;
};

export function OnboardingForm({ initial, nextPath, isFirstTime }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingInput),
    defaultValues: {
      hostel: initial.hostel || undefined,
      entryYear: initial.entryYear ?? undefined,
      phone: initial.phone,
    },
  });

  function onSubmit(values: OnboardingInput) {
    setServerError(null);
    startTransition(async () => {
      const res = await completeOnboarding(values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-7"
      noValidate
    >
      <div>
        <Label htmlFor="hostel">Hostel</Label>
        <Controller
          control={control}
          name="hostel"
          render={({ field }) => (
            <HostelSelect
              id="hostel"
              name={field.name}
              value={(field.value ?? "") as Hostel | ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              hasError={!!errors.hostel}
            />
          )}
        />
        <FieldError msg={errors.hostel?.message} />
      </div>

      <div>
        <Label htmlFor="entryYear">Entry year</Label>
        <select
          id="entryYear"
          defaultValue={initial.entryYear ?? ""}
          className={cn(selectCls(!!errors.entryYear))}
          {...register("entryYear", { valueAsNumber: true })}
        >
          <option value="" disabled>
            Select your entry year
          </option>
          {ENTRY_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <p className="text-meta text-ink-soft mt-1">
          The year you joined IIT Delhi. Prefilled from your entry number when
          we can; correct it if it is wrong.
        </p>
        <FieldError msg={errors.entryYear?.message} />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98xxxxxxxx"
          className={inputCls(!!errors.phone)}
          {...register("phone")}
        />
        <p className="text-meta text-ink-soft mt-1">
          Used by mentors and organisers to reach you about the track.
        </p>
        <FieldError msg={errors.phone?.message} />
      </div>

      {serverError && (
        <div
          role="alert"
          className="border border-accent/40 bg-accent-soft/60 px-4 py-3 text-meta text-accent-deep"
        >
          {serverError}
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
            ? "Saving…"
            : isFirstTime
              ? "Finish and continue"
              : "Save changes"}
        </button>
      </div>
    </form>
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

function selectCls(hasError: boolean) {
  return cn(
    inputCls(hasError),
    "appearance-none bg-[length:12px_12px] bg-[right_2px_center] bg-no-repeat pr-7",
    // Caret in --accent-deep (#734030), matches the focus underline.
    "bg-[image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22%23734030%22><path d=%22M3.5 6 8 10.5 12.5 6z%22/></svg>')]",
  );
}
