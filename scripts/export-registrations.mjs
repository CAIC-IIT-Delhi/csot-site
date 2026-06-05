#!/usr/bin/env node
/**
 * Export csot_registrations joined with csot_users to CSV.
 * Usage: set -a && source .env.local && set +a && node scripts/export-registrations.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "csot-registrations-export.csv");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const COLUMNS = [
  "entry_number",
  "name",
  "kerberos",
  "email",
  "department",
  "phone",
  "hostel",
  "entry_year",
  "onboarded_at",
  "user_created_at",
  "last_seen_at",
  "track_slug",
  "past_experience",
  "why_track",
  "commitment_hours",
  "registration_created_at",
  "registration_updated_at",
];

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToCsv(row) {
  return COLUMNS.map((c) => csvEscape(row[c])).join(",");
}

const PAGE = 1000;
const allRegs = [];
let from = 0;

while (true) {
  const { data, error } = await supabase
    .from("csot_registrations")
    .select(
      `
      track_slug,
      past_experience,
      why_track,
      commitment_hours,
      created_at,
      updated_at,
      csot_users (
        kerberos,
        entry_number,
        name,
        email,
        department,
        phone,
        hostel,
        entry_year,
        onboarded_at,
        created_at,
        last_seen_at
      )
    `,
    )
    .order("track_slug", { ascending: true })
    .order("created_at", { ascending: true })
    .range(from, from + PAGE - 1);

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  if (!data?.length) break;
  allRegs.push(...data);
  if (data.length < PAGE) break;
  from += PAGE;
}

const rows = allRegs.map((reg) => {
  const u = reg.csot_users;
  const user = Array.isArray(u) ? u[0] : u;
  return {
    entry_number: user?.entry_number ?? "",
    name: user?.name ?? "",
    kerberos: user?.kerberos ?? "",
    email: user?.email ?? "",
    department: user?.department ?? "",
    phone: user?.phone ?? "",
    hostel: user?.hostel ?? "",
    entry_year: user?.entry_year ?? "",
    onboarded_at: user?.onboarded_at ?? "",
    user_created_at: user?.created_at ?? "",
    last_seen_at: user?.last_seen_at ?? "",
    track_slug: reg.track_slug ?? "",
    past_experience: reg.past_experience ?? "",
    why_track: reg.why_track ?? "",
    commitment_hours: reg.commitment_hours ?? "",
    registration_created_at: reg.created_at ?? "",
    registration_updated_at: reg.updated_at ?? "",
  };
});

const csv = [COLUMNS.join(","), ...rows.map(rowToCsv)].join("\n") + "\n";
writeFileSync(outPath, csv, "utf8");

console.log(`Wrote ${rows.length} rows to ${outPath}`);
