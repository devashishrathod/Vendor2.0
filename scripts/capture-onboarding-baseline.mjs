#!/usr/bin/env node
// Onboarding v2 — item 0, live baseline. Saves the REAL stage responses of
// the onboarding GET routes for one of the team's own test vendors, so the
// panel's shapes are checked against what the server actually sends.
//
// GET only. It never calls verify-*, add-*, skip, continue or any OTP route.
//
// Usage (PowerShell):
//   $env:VENDOR_TOKEN = "<vendor JWT>"; node scripts/capture-onboarding-baseline.mjs gst
// Usage (bash):
//   VENDOR_TOKEN="<vendor JWT>" node scripts/capture-onboarding-baseline.mjs gst
//
// Optional: STAGE_BASE_URL (default https://staging-api.trydood.com/trydood/v1).
// Output:   docs/onboarding-v2-baseline/<label>/<name>.json (gitignored).
// The token is read from the environment only; it is never printed or saved.
// Signed file links and full bank account numbers are redacted on save.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "https://staging-api.trydood.com/trydood/v1";

const ENDPOINTS = [
  { name: "onboarding-status", path: "/brands/onboarding/status" },
  { name: "brands-get", path: "/brands/get" },
  { name: "billing-address", path: "/brands/billing-address" },
  { name: "onboarding-documents", path: "/brands/onboarding/documents" },
  { name: "profile-strength", path: "/brands/profile-strength" },
  { name: "subscriptions-get-all", path: "/subscriptions/getAll" },
];

const REDACT_KEYS = new Set(["accountNumber", "fileUrl", "proofUrl", "token"]);

/** Replaces sensitive values, keeping the key and the value's type visible. */
function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key,
        REDACT_KEYS.has(key) && inner != null ? `<redacted ${typeof inner}>` : redact(inner),
      ]),
    );
  }
  return value;
}

async function main() {
  const label = process.argv[2];
  const token = process.env.VENDOR_TOKEN;
  const baseUrl = (process.env.STAGE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

  if (!label || !/^[a-z0-9_-]+$/i.test(label)) {
    console.error("Give a label for this vendor, e.g. gst, no_gst, unregistered.");
    process.exit(1);
  }
  if (!token) {
    console.error("Set VENDOR_TOKEN to the test vendor's JWT (it is not saved or printed).");
    process.exit(1);
  }

  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "onboarding-v2-baseline", label);
  await mkdir(root, { recursive: true });

  const summary = [];
  for (const { name, path } of ENDPOINTS) {
    let status = null;
    let body = null;
    try {
      const res = await fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      status = res.status;
      body = await res.json().catch(() => null);
    } catch (error) {
      body = { networkError: String(error?.message || error) };
    }
    await writeFile(
      join(root, `${name}.json`),
      `${JSON.stringify({ request: { method: "GET", path }, status, capturedAt: new Date().toISOString(), body: redact(body) }, null, 2)}\n`,
    );
    summary.push({ name, status, code: body?.details?.code ?? null, currentScreen: body?.data?.currentScreen ?? null });
  }

  console.table(summary);
  console.log(`Saved to ${root}`);
}

main();
