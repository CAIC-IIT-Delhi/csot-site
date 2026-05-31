import type { DefaultSession } from "next-auth";
import type { Hostel } from "@/lib/hostels";

declare module "next-auth" {
  interface User {
    kerberos?: string | null;
    entryNumber?: string | null;
    department?: string | null;
    phone?: string | null;
  }

  interface Session {
    user: {
      /** Set only after onboarding. Absence == needs onboarding. */
      id?: string;
      kerberos: string;
      entryNumber: string | null;
      department: string | null;
      phone: string | null;
      hostel: Hostel | null;
      entryYear: number | null;
      onboarded: boolean;
    } & DefaultSession["user"];
  }

  interface Profile {
    sub?: string;
    name?: string;
    email?: string;
    kerberos?: string;
    entry_number?: string;
    department?: string;
    phone?: string;
    hostel?: string;
    picture?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    csotUserId?: string;
    kerberos?: string;
    entryNumber?: string | null;
    department?: string | null;
    phone?: string | null;
    userHostel?: string | null;
    userEntryYear?: number | null;
    onboarded?: boolean;
  }
}
