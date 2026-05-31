/**
 * Club metadata — display name, logo asset, and CAIC reference link.
 * Keys match the short identifiers used in `Track.clubs[]`.
 */
export type Club = {
  /** Short key used inside Track.clubs[]. */
  key: string;
  /** Full display name, used in tooltips. */
  fullName: string;
  /** Path under /public; undefined → no logo (renders monogram fallback). */
  logo?: string;
  /** Optional CAIC clubs page link. */
  href?: string;
};

const CLUBS_LIST: Club[] = [
  {
    key: "ARIES",
    fullName: "ARIES — Artificial Intelligence Society",
    logo: "/clubs/aries.png",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "Dev",
    fullName: "DevClub",
    logo: "/clubs/DevClub.png",
    href: "https://devclub.in",
  },
  {
    key: "BnC",
    fullName: "Business and Consulting Club",
    logo: "/clubs/bnc.jpeg",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "Aero",
    fullName: "AeroClub — Aerial Systems Club",
    logo: "/clubs/aeroclub.png",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "Eco",
    fullName: "Economics and Finance Club",
    logo: "/clubs/ecoclub.png",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "ANCC",
    fullName: "Algorithms and Coding Club (ANCC)",
    logo: "/clubs/ancc.png",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "IGTS",
    fullName: "Indian Game Theory Society",
    logo: "/clubs/igts.png",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "Robo",
    fullName: "Robotics Club",
    logo: "/clubs/RoboticsClub.png",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "PAC",
    fullName: "Physics & Astronomy Club",
    logo: "/clubs/PAC.svg",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "ACES",
    fullName: "ACES ACM",
    logo: "/clubs/aces.png",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "iGEM",
    fullName: "iGEM — International Genetically Engineered Machine",
    logo: "/clubs/igem.jpeg",
    href: "https://caic.iitd.ac.in/clubs/",
  },
  {
    key: "BlocSoc",
    fullName: "BlocSoc — Blockchain Society",
    logo: "/clubs/blocsoc.png",
    href: "https://blocsoc.in",
  },
];

const CLUBS: Record<string, Club> = Object.fromEntries(
  CLUBS_LIST.map((c) => [c.key, c]),
);

export function getClub(key: string): Club {
  return (
    CLUBS[key] ?? {
      key,
      fullName: key,
    }
  );
}

export function listClubs(keys: readonly string[]): Club[] {
  return keys.map(getClub);
}
