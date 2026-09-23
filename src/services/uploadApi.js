// src/services/uploadApi.js
// Generic presigned-S3-upload flow (POST /uploads/presign → S3 → POST
// /uploads/confirm), confirmed from vendor_panel_api_doc.md #94/#95.
// Reusable by any surface that's had its own backend endpoint updated to
// accept an `uploadId` — currently Showcase media and Voucher (images +
// banner). Not every surface takes an uploadId yet (e.g. brand logo is
// still multipart-only) — check the target surface's own docs first.
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import("../features/onboarding/store/authStore");
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function handleError(error) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again.";
  throw new Error(message);
}

// Every purpose confirmed in the doc so far — add more here as new surfaces
// join the presigned flow (doc calls this "U-3/U-4/U-5" rollout).
export const UPLOAD_PURPOSES = {
  VOUCHER_IMAGE: "VOUCHER_IMAGE",
  VOUCHER_BANNER: "VOUCHER_BANNER",
  VOUCHER_BANNER_POSTER: "VOUCHER_BANNER_POSTER",
  SHOWCASE_MEDIA: "SHOWCASE_MEDIA",
  SHOWCASE_THUMBNAIL: "SHOWCASE_THUMBNAIL",
};

// ── POST /uploads/presign ────────────────────────────────────────
// body: { purpose, contentType, sizeBytes, fileName? }
// Confirmed response: { data: { uploadId, url, fields, expiresInSeconds,
// stagingKey, typePrefix } }
export async function presignUpload({ purpose, contentType, sizeBytes, fileName }) {
  try {
    const body = { purpose, contentType, sizeBytes };
    if (fileName) body.fileName = fileName;
    const { data } = await api.post("/uploads/presign", body);
    return data;
  } catch (error) {
    handleError(error);
  }
}

// ── Raw multipart POST straight to S3 using the presigned policy ────
// `fields` MUST be appended before `file` — S3 stops reading the moment it
// hits the file part, so anything appended after it never lands.
// Confirmed from doc: S3 replies 204 with no body on success.
async function uploadFileToS3({ url, fields }, file) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  form.append("file", file);
  let res;
  try {
    res = await fetch(url, { method: "POST", body: form });
  } catch {
    throw new Error("Could not reach storage to upload the file.");
  }
  if (!res.ok) {
    throw new Error(`Upload to storage failed (status ${res.status}).`);
  }
}

// ── POST /uploads/confirm ────────────────────────────────────────
// body: { uploadId, entityId? }
export async function confirmUpload({ uploadId, entityId }) {
  try {
    const body = { uploadId };
    if (entityId) body.entityId = entityId;
    const { data } = await api.post("/uploads/confirm", body);
    return data;
  } catch (error) {
    handleError(error);
  }
}

/**
 * Full presign → S3 → confirm flow for one file. Returns just the
 * `uploadId` — that's the only thing the surface's own create/update
 * endpoint needs (per doc: the confirm response's `storage`/`metadata`
 * are never sent anywhere by the client).
 *
 * @param {File} file
 * @param {string} purpose - one of UPLOAD_PURPOSES
 * @param {{ entityId?: string, onProgress?: (percent:number)=>void }} [options]
 * @returns {Promise<string>} uploadId
 */
export async function uploadFileViaPresign(file, purpose, { entityId, onProgress } = {}) {
  if (!file) throw new Error("file is required");
  if (!purpose) throw new Error("purpose is required");

  onProgress?.(0);
  const presign = await presignUpload({
    purpose,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    fileName: file.name,
  });
  const { uploadId, url, fields } = presign?.data ?? presign ?? {};
  if (!uploadId || !url || !fields) {
    throw new Error("Upload authorization did not return the expected data.");
  }

  onProgress?.(35);
  await uploadFileToS3({ url, fields }, file);

  onProgress?.(75);
  await confirmUpload({ uploadId, entityId });

  onProgress?.(100);
  return uploadId;
}

/**
 * Runs uploadFileViaPresign for a batch of files, in order, reporting
 * combined progress across the whole batch (not just the current file).
 *
 * @param {File[]} files
 * @param {string} purpose
 * @param {{ entityId?: string, onProgress?: (percent:number)=>void }} [options]
 * @returns {Promise<string[]>} uploadIds, same order as files
 */
export async function uploadFilesViaPresign(files, purpose, { entityId, onProgress } = {}) {
  const uploadIds = [];
  const total = files.length;
  for (let i = 0; i < total; i += 1) {
    const uploadId = await uploadFileViaPresign(files[i], purpose, {
      entityId,
      onProgress: (filePercent) => {
        const overall = ((i + filePercent / 100) / total) * 100;
        onProgress?.(Math.round(overall));
      },
    });
    uploadIds.push(uploadId);
  }
  return uploadIds;
}
