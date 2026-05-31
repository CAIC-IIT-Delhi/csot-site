import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const session = await auth();
  const callbackUrl = params.callbackUrl ?? "/dashboard";

  if (session?.user) redirect(callbackUrl);

  async function startSignIn() {
    "use server";
    await signIn("devclub", { redirectTo: callbackUrl });
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-meta tracking-[0.18em] uppercase text-accent-deep">
          Sign in
        </p>
        <h1 className="serif mt-3 text-h1 text-ink">
          Sign in with your IIT Delhi account.
        </h1>

        {params.error ? (
          <p className="mt-6 rounded-md border border-rule bg-paper px-4 py-3 text-meta text-accent-deep">
            Sign-in did not complete. Please try again.
          </p>
        ) : null}

        <form action={startSignIn} className="mt-10">
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 text-body font-medium text-cream transition-transform duration-150 hover:-translate-y-px hover:bg-accent-deep"
          >
            Continue
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </main>
  );
}
