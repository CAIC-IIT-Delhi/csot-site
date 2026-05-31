import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { EditableLeaderboardSlug } from "./credentials";

const COOKIE_NAME = "csot_lb_editor";
const SESSION_DAYS = 7;

type SessionPayload = {
  slug: EditableLeaderboardSlug;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET must be set for leaderboard editor sessions");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(body);
  return `${body}.${sig}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload.slug || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setEditorSession(slug: EditableLeaderboardSlug) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = encodeSession({ slug, exp });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearEditorSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getEditorSessionSlug(): Promise<EditableLeaderboardSlug | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decodeSession(token);
  return payload?.slug ?? null;
}

export async function assertEditorSession(
  slug: EditableLeaderboardSlug,
): Promise<boolean> {
  const sessionSlug = await getEditorSessionSlug();
  return sessionSlug === slug;
}
