"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawFromTrack } from "@/app/actions/registrations";

type Props = {
  trackSlug: string;
  trackName: string;
};

export function WithdrawButton({ trackSlug, trackName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onWithdraw() {
    setError(null);
    startTransition(async () => {
      const res = await withdrawFromTrack(trackSlug);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-4 inline-flex items-center gap-2 text-meta uppercase tracking-[0.14em] text-ink-soft underline-offset-4 hover:text-accent-deep hover:underline"
      >
        Withdraw from this track
      </button>
    );
  }

  return (
    <div className="mt-4 border border-accent/40 bg-accent-soft/60 p-5">
      <p className="text-body text-ink">
        Withdraw from <strong className="serif">{trackName}</strong>? Your
        responses will be deleted. You can register again later.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-meta text-accent-deep">
          {error}
        </p>
      )}
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={onWithdraw}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-accent-deep px-5 text-meta uppercase tracking-[0.14em] text-cream disabled:opacity-60"
        >
          {isPending ? "Withdrawing…" : "Yes, withdraw"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-meta uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
        >
          Keep me registered
        </button>
      </div>
    </div>
  );
}
