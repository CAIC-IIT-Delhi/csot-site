import NextAuth, { customFetch, type NextAuthConfig } from "next-auth";
import { getSupabase } from "@/lib/supabase/server";
import type { Hostel } from "@/lib/hostels";

const DEVCLUB_WELL_KNOWN =
  "https://auth.devclub.in/api/oauth/.well-known/openid-configuration";

/**
 * Auth.js / @auth/core v5 derives the discovery URL as
 * `${issuer}/.well-known/openid-configuration`, which 404s for DevClub IITD
 * because their discovery document lives under `/api/oauth/`. Intercept the
 * discovery fetch and rewrite the path. Every other request is passed through.
 */
const devclubFetch: typeof fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (url.endsWith("/.well-known/openid-configuration")) {
    return fetch(DEVCLUB_WELL_KNOWN, init);
  }
  return fetch(input as Request, init);
};

function pickKerberos(profile: Record<string, unknown>): string | null {
  const candidates = [
    profile.kerberos,
    profile.preferred_username,
    profile.username,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  providers: [
    {
      id: "devclub",
      name: "IIT Delhi",
      type: "oidc",
      issuer: "https://auth.devclub.in",
      clientId: process.env.DEVCLUB_CLIENT_ID,
      clientSecret: process.env.DEVCLUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid profile email kerberos entry_number department phone",
        },
      },
      checks: ["pkce", "state"],
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      [customFetch]: devclubFetch,
      profile(profile) {
        const kerberos = pickKerberos(profile);
        return {
          id: kerberos ?? (profile.sub as string),
          name: (profile.name as string | undefined) ?? null,
          email: (profile.email as string | undefined) ?? null,
          image: (profile.picture as string | undefined) ?? null,
          kerberos,
          entryNumber: (profile.entry_number as string | undefined) ?? null,
          department: (profile.department as string | undefined) ?? null,
          phone: (profile.phone as string | undefined) ?? null,
        };
      },
    },
  ],
  callbacks: {
    /**
     * Intentionally does not write to the database. The csot_users row is
     * created only after the user completes the onboarding form (so we do
     * not persist anyone who bounces off the sign-in flow).
     */
    async signIn({ user, profile }) {
      const kerberos =
        (user as { kerberos?: string | null }).kerberos ??
        (profile ? pickKerberos(profile as Record<string, unknown>) : null);
      return Boolean(kerberos);
    },

    async jwt({ token, user, profile }) {
      // First sign-in: capture OIDC claims into the token.
      if (user) {
        const kerberos =
          (user as { kerberos?: string | null }).kerberos ??
          (profile ? pickKerberos(profile as Record<string, unknown>) : null);
        if (kerberos) {
          token.kerberos = kerberos;
          token.entryNumber =
            (user as { entryNumber?: string | null }).entryNumber ?? null;
          token.department =
            (user as { department?: string | null }).department ?? null;
          token.phone = (user as { phone?: string | null }).phone ?? null;
        }
      }

      // On every call: if we have not yet linked to a csot_users row, try
      // to look one up. This costs one DB query per request only until the
      // user finishes onboarding; after that the token is warm.
      if (token.kerberos && !token.csotUserId) {
        const supabase = getSupabase();
        const { data } = await supabase
          .from("csot_users")
          .select("id, hostel, entry_year, phone, onboarded_at")
          .eq("kerberos", token.kerberos)
          .maybeSingle();
        if (data?.id) {
          token.csotUserId = data.id as string;
          token.userHostel = (data.hostel as string | null) ?? null;
          token.userEntryYear = (data.entry_year as number | null) ?? null;
          if (data.phone) token.phone = data.phone as string;
          token.onboarded = Boolean(data.onboarded_at);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (typeof token.csotUserId === "string") {
        session.user.id = token.csotUserId;
      }
      session.user.kerberos =
        typeof token.kerberos === "string" ? token.kerberos : "";
      session.user.entryNumber =
        typeof token.entryNumber === "string" ? token.entryNumber : null;
      session.user.department =
        typeof token.department === "string" ? token.department : null;
      session.user.phone =
        typeof token.phone === "string" ? token.phone : null;
      session.user.hostel =
        typeof token.userHostel === "string"
          ? (token.userHostel as Hostel)
          : null;
      session.user.entryYear =
        typeof token.userEntryYear === "number" ? token.userEntryYear : null;
      session.user.onboarded = Boolean(token.onboarded);
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
