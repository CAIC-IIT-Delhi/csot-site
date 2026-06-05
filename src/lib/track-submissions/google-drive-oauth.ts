import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { google } from "googleapis";
import type { EditableLeaderboardSlug } from "@/lib/leaderboard-editor/credentials";

export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
];

const STATE_TTL_MS = 10 * 60 * 1000;

type OAuthState = {
  trackSlug: EditableLeaderboardSlug;
  exp: number;
};

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be set");
  return secret;
}

function signState(body: string): string {
  return createHmac("sha256", authSecret()).update(body).digest("base64url");
}

export function encodeOAuthState(trackSlug: EditableLeaderboardSlug): string {
  const payload: OAuthState = {
    trackSlug,
    exp: Date.now() + STATE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signState(body)}`;
}

export function decodeOAuthState(token: string): OAuthState | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = signState(body);
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as OAuthState;
    if (!payload.trackSlug || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim();
  const authUrl = process.env.AUTH_URL?.replace(/\/$/, "");
  if (!clientId || !clientSecret || !authUrl) {
    return null;
  }
  const redirectUri = `${authUrl}/api/track-admin/google-drive/callback`;
  return { clientId, clientSecret, redirectUri };
}

export function createGoogleOAuth2Client() {
  const config = getGoogleOAuthConfig();
  if (!config) {
    throw new Error("Google Drive OAuth is not configured on the server.");
  }
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  );
}

export function buildGoogleDriveAuthUrl(trackSlug: EditableLeaderboardSlug) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    throw new Error("Google Drive OAuth is not configured on the server.");
  }
  const client = createGoogleOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_DRIVE_SCOPES,
    state: encodeOAuthState(trackSlug),
  });
}

export async function exchangeGoogleDriveCode(code: string) {
  const client = createGoogleOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Revoke app access in your Google account and try again.",
    );
  }

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email?.trim();
  if (!email) {
    throw new Error("Could not read Google account email.");
  }

  return { refreshToken: tokens.refresh_token, email };
}

export async function fetchGoogleDriveAccessToken(
  refreshToken: string,
): Promise<string> {
  const client = createGoogleOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const res = await client.getAccessToken();
  const token = res.token;
  if (!token) {
    throw new Error("Could not refresh Google Drive access token.");
  }
  return token;
}
