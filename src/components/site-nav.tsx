import Link from "next/link";
import Image from "next/image";
import { auth, signIn, signOut } from "@/auth";
import { listLeaderboardTracks } from "@/lib/tracks";
import { LeaderboardMenu } from "@/components/leaderboard-menu";

export async function SiteNav() {
  const session = await auth();
  const leaderboardTracks = listLeaderboardTracks().map((t) => ({
    slug: t.slug,
    name: t.name,
  }));

  return (
    <header className="border-b border-rule/70">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <a
            href="https://caic.iitd.ac.in"
            target="_blank"
            rel="noreferrer"
            title="CAIC, IIT Delhi"
            className="block"
          >
            <Image
              src="/caic-logo.png"
              alt="CAIC"
              width={32}
              height={32}
              className="size-8 rounded-sm"
              priority
            />
          </a>
          <Link
            href="/"
            className="serif text-h3 text-ink leading-none tracking-tight"
          >
            CSoT
            <span className="font-mono text-meta ml-1 align-top text-accent-deep">
              ’26
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-6 text-meta uppercase tracking-[0.16em] text-ink-soft">
          <Link
            href="/#tracks"
            className="hidden transition-colors hover:text-ink sm:inline"
          >
            Tracks
          </Link>
          <LeaderboardMenu tracks={leaderboardTracks} />
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="transition-colors hover:text-ink"
              >
                Dashboard
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("devclub", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="rounded-full bg-ink px-4 py-2 font-sans text-meta uppercase tracking-[0.14em] text-cream transition-transform hover:-translate-y-px"
              >
                Sign in
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}

