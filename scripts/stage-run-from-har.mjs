#!/usr/bin/env node
// Onboarding v2 — stage run table. Reads a HAR the team dev exported from the
// browser's Network tab while clicking through the panel on stage, and builds
// the report table: screen → API called → response code → next screen.
//
// The run itself is done in the panel UI; this only reads what the browser
// recorded. Export with DevTools → Network → "Preserve log" on → right-click
// → "Save all as HAR (sanitized)" (the sanitized export has no Authorization
// header or cookies).
//
// Usage:
//   node scripts/stage-run-from-har.mjs <file.har> <label>
//   npm run stage-run:table -- docs/onboarding-v2-baseline/stage-run/gst.har gst
//
// Output (gitignored): docs/onboarding-v2-baseline/stage-run/<label>.md
//                      docs/onboarding-v2-baseline/stage-run/<label>-responses.json
// Never printed or saved: request headers, request bodies (OTP, PAN, GSTIN,
// account numbers), tokens, signed file links, contact numbers.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API_MARKER = "/trydood/v1";
const STATUS_PATH = "/brands/onboarding/status";

// Enum-like request fields that are safe to show next to the API name.
const SAFE_BODY_FIELDS = ["step", "screen", "kycPath", "method", "idType", "docType", "businessEntityType", "accountType", "mode"];

const REDACT_KEYS = new Set([
  "token",
  "otp",
  "accountNumber",
  "fileUrl",
  "proofUrl",
  "providerResponse",
  "verificationResponse",
  "whatsappNumber",
  "mobile",
  "email",
  "contact",
]);

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key,
        REDACT_KEYS.has(key) && inner != null ? `<redacted ${Array.isArray(inner) ? "array" : typeof inner}>` : redact(inner),
      ]),
    );
  }
  return value;
}

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

function responseBody(entry) {
  const content = entry.response?.content;
  if (!content?.text) return null;
  const text = content.encoding === "base64" ? Buffer.from(content.text, "base64").toString("utf8") : content.text;
  return parseJson(text);
}

function requestFields(entry) {
  const post = entry.request?.postData;
  if (!post) return "";
  let fields = {};
  if (post.text && /json/i.test(post.mimeType || "")) fields = parseJson(post.text) ?? {};
  else if (Array.isArray(post.params)) fields = Object.fromEntries(post.params.filter((p) => !p.fileName).map((p) => [p.name, p.value]));
  return SAFE_BODY_FIELDS.filter((k) => typeof fields[k] === "string" || typeof fields[k] === "boolean")
    .map((k) => `${k}=${fields[k]}`)
    .join(" ");
}

function apiPath(url) {
  const u = new URL(url);
  const at = u.pathname.indexOf(API_MARKER);
  const path = at >= 0 ? u.pathname.slice(at + API_MARKER.length) : u.pathname;
  return path.replace(/\/[a-f0-9]{24}(?=\/|$)/gi, "/:id");
}

/** The screen a response moves the vendor to, if it says. */
function screenFrom(body) {
  const d = body?.data;
  if (typeof d?.currentScreen === "string") return d.currentScreen;
  if (typeof d?.user?.currentScreen === "string") return d.user.currentScreen;
  if (typeof body?.details?.currentScreen === "string") return body.details.currentScreen;
  return null;
}

const cell = (v) => String(v ?? "").replace(/\|/g, "\\|");

function toTable(rows) {
  const head = "| # | Time | Screen (before) | API | Body | Code | Next screen |\n|---|---|---|---|---|---|---|";
  const lines = rows.map((r) =>
    `| ${r.n} | ${cell(r.time)} | ${cell(r.screen)} | ${cell(r.api)} | ${cell(r.fields)} | ${cell(r.code)} | ${cell(r.next)} |`,
  );
  return [head, ...lines].join("\n");
}

async function main() {
  const [harPath, label] = process.argv.slice(2);
  if (!harPath || !label || !/^[a-z0-9_-]+$/i.test(label)) {
    console.error("Usage: node scripts/stage-run-from-har.mjs <file.har> <label>   (label: gst, no_gst, unregistered, …)");
    process.exit(1);
  }

  const har = parseJson(await readFile(harPath, "utf8"));
  const entries = (har?.log?.entries ?? [])
    .filter((e) => e.request?.method !== "OPTIONS" && String(e.request?.url || "").includes(API_MARKER))
    .sort((a, b) => new Date(a.startedDateTime) - new Date(b.startedDateTime));

  if (!entries.length) {
    console.error("No API calls found in this HAR. Was “Preserve log” on, and was the export from the panel tab?");
    process.exit(1);
  }

  const all = [];
  const responses = [];
  let screen = "—";
  let lastStatusScreen = null;

  entries.forEach((entry, i) => {
    const body = responseBody(entry);
    const method = entry.request.method;
    const path = apiPath(entry.request.url);
    const status = entry.response?.status ?? 0;
    const code = body?.details?.code;
    const next = screenFrom(body);
    const isStatusRead = method === "GET" && path === STATUS_PATH;

    const row = {
      n: i + 1,
      time: String(entry.startedDateTime || "").slice(11, 19),
      screen,
      api: `${method} ${path}`,
      fields: requestFields(entry),
      code: status === 0 ? "no response" : `${status}${code ? ` ${code}` : ""}`,
      next: next && next !== screen ? next : "",
      // Compact table: every write, every error, and status reads that show a new screen.
      key: method !== "GET" || status >= 400 || status === 0 || (isStatusRead && next && next !== lastStatusScreen),
    };
    all.push(row);

    if (body && (method !== "GET" || isStatusRead || status >= 400)) {
      responses.push({ n: row.n, api: row.api, status, body: redact(body) });
    }
    if (isStatusRead && next) lastStatusScreen = next;
    if (next) screen = next;
  });

  const compact = all.filter((r) => r.key);
  const codes = all.reduce((acc, r) => ({ ...acc, [r.code]: (acc[r.code] ?? 0) + 1 }), {});
  const failures = all.filter((r) => /^(4|5)\d\d|no response/.test(r.code));

  const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "onboarding-v2-baseline", "stage-run");
  await mkdir(outDir, { recursive: true });

  const md = [
    `# Stage run — ${label}`,
    "",
    `HAR: ${basename(harPath)} · ${entries.length} API calls · ${entries[0].startedDateTime} → ${entries.at(-1).startedDateTime}`,
    `Last screen seen: **${screen}**`,
    "",
    "## Steps (writes, errors, screen changes)",
    "",
    toTable(compact),
    "",
    "## Response codes",
    "",
    ...Object.entries(codes).map(([c, n]) => `- ${c}: ${n}`),
    "",
    "## Every API call",
    "",
    toTable(all),
    "",
  ].join("\n");

  await writeFile(join(outDir, `${label}.md`), md);
  await writeFile(join(outDir, `${label}-responses.json`), `${JSON.stringify(responses, null, 2)}\n`);

  console.log(toTable(compact));
  console.log(`\nLast screen: ${screen} · ${entries.length} API calls · ${failures.length} with 4xx/5xx/no response`);
  failures.forEach((f) => console.log(`  #${f.n} ${f.api} → ${f.code}`));
  console.log(`\nSaved ${join(outDir, `${label}.md`)}`);
}

main();
