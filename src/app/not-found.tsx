import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto flex max-w-[760px] flex-1 flex-col items-start justify-center px-6 py-24">
        <p className="font-mono text-meta uppercase tracking-[0.22em] text-accent-deep">
          404
        </p>
        <h1 className="serif mt-3 text-h1 text-ink">
          That page is not part of CSoT.
        </h1>
        <p className="mt-4 text-body text-ink-soft">
          The link might be old, or that track does not exist. Head back to the
          list and pick something else.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-ink px-7 text-body font-medium text-cream transition-transform hover:-translate-y-px"
        >
          Back to home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
