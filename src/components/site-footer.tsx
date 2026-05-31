import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-rule/70 bg-paper/40">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="flex items-start gap-4">
          <a
            href="https://caic.iitd.ac.in"
            target="_blank"
            rel="noreferrer"
            title="CAIC, IIT Delhi"
            className="block shrink-0"
          >
            <Image
              src="/caic-logo.png"
              alt="CAIC"
              width={48}
              height={48}
              className="size-12 rounded-sm"
            />
          </a>
          <div>
            <p className="serif text-h3 text-ink">CAIC Summer of Tech</p>
            <p className="mt-1 text-meta text-ink-soft">
              Run by{" "}
              <a
                href="https://caic.iitd.ac.in"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-accent/60 underline-offset-2 hover:text-ink"
              >
                CAIC
              </a>{" "}
              and partner clubs at IIT Delhi.
            </p>
          </div>
        </div>
        <p className="font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
          csot.devclub.in
        </p>
      </div>
    </footer>
  );
}
