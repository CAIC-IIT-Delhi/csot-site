import "server-only";

/** Public site origin for redirects and OAuth (never the internal bind address). */
export function getSiteOrigin(): string {
  const url = process.env.AUTH_URL?.trim().replace(/\/$/, "");
  if (!url) {
    throw new Error("AUTH_URL must be set to the public site URL.");
  }
  return url;
}

export function siteUrl(path: string): URL {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, `${getSiteOrigin()}/`);
}
