import Image from "next/image";
import { type Club, listClubs } from "@/lib/clubs";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = { sm: 22, md: 30, lg: 44 };
const SIZE_CLS: Record<Size, string> = {
  sm: "size-[22px]",
  md: "size-[30px]",
  lg: "size-[44px]",
};

function Monogram({ club, size }: { club: Club; size: Size }) {
  const letters = club.key
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-paper font-mono font-semibold text-accent-deep ring-1 ring-rule",
        SIZE_CLS[size],
        size === "sm" ? "text-[10px]" : size === "md" ? "text-[11px]" : "text-[14px]",
      )}
    >
      {letters || "·"}
    </span>
  );
}

export function ClubLogo({
  club,
  size = "md",
}: {
  club: Club;
  size?: Size;
}) {
  if (!club.logo) return <Monogram club={club} size={size} />;
  const px = SIZE_PX[size];
  return (
    <span
      title={club.fullName}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper ring-1 ring-rule",
        SIZE_CLS[size],
      )}
    >
      <Image
        src={club.logo}
        alt=""
        width={px}
        height={px}
        className="size-full object-cover"
        unoptimized={club.logo.endsWith(".svg")}
      />
    </span>
  );
}

/**
 * Overlapping stack of small club logos, used in track cards. Cream ring
 * gives each tile a subtle gap so different logo backgrounds don't blend.
 */
export function ClubLogoStack({
  clubKeys,
  size = "md",
}: {
  clubKeys: readonly string[];
  size?: Size;
}) {
  const clubs = listClubs(clubKeys);
  return (
    <span className="inline-flex items-center -space-x-2">
      {clubs.map((c) => (
        <span
          key={c.key}
          className="ring-2 ring-cream rounded-full"
          title={c.fullName}
        >
          <ClubLogo club={c} size={size} />
        </span>
      ))}
    </span>
  );
}
