import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import MediaPreviewModal from "./modals/MediaPreviewModal";
import VideoUploadModal from "./modals/VideoUploadModal";
import ErrorToast from "../../../../../components/common/ErrorToast";
import Select from "../../../../../components/common/Select";
import {
  MAX_ALBUMS,
  MIN_ITEMS_PER_ALBUM,
  MAX_ITEMS_PER_ALBUM,
  MAX_VIDEOS_PER_ALBUM,
  SHOWCASE_MONTHS,
  QUICK_ALBUM_PRESETS,
  isVideoOnlyAlbum,
  isMonthlyAlbum,
} from "../../constants/brandOutletConstants";
import {
  createShowcaseSection,
  updateShowcaseSection,
  deleteShowcaseSection,
  addShowcaseMedia,
  deleteShowcaseMedia,
  getBrandShowcase,
} from "../../services/showcaseApi";

// Shape produced: [{ id, name, media: [...], status, error, persisted }]
// where each media item is:
//   { id, type: 'image'|'video', file, preview, month, isShowInVideoClips, status, error, persisted }
//
// `id` starts as a local temp id and is swapped for the real server `_id`
// once the create/upload call succeeds — `persisted: true` marks that swap
// as done, which is what gates rename/delete/upload calls hitting the API
// instead of just editing local state.
//
// ── Prefill on mount ────────────────────────────────────────────
// GET showcase/get-brand-showcase/:brandId is called once when this
// component mounts (guarded by hydratedRef so it never re-fires). This one
// endpoint is expected to return every section for the brand AND its
// nested media in one shot, so both albums and their photos/videos show up
// immediately instead of the merchant re-uploading everything.
//
// Prefilled media items have `file: null` (we only have the server URL,
// not the original File object) — that's fine, they're already
// `persisted: true` so rename/delete/upload flows work off their real
// server ids without needing the raw file again.
//
// CONFIRMED response shape (get-brand-showcase): data.sections[], each with
// medias[]. Each media item's `type` field comes back UPPERCASE
// ("PHOTO" / "VIDEO"), while the rest of this component compares against
// lowercase "video"/"image" everywhere (video icon, MAX_VIDEOS_PER_ALBUM
// counting, MediaPreviewModal's video-vs-image branch). That casing
// mismatch was the bug: `m.type || (...)` used the truthy uppercase value
// as-is instead of falling through, so every prefilled video item ended up
// with type "VIDEO" and silently failed every `=== "video"` check below.
// Fixed by lowercasing `m.type` when it exists.
let albumIdCounter = 0;
let showcaseMediaIdCounter = 0;

// Real Mongo ids from the server are 24 hex chars — a temp id (e.g.
// "sm42") never matches this. Used as a belt-and-suspenders check before
// any delete/update call that needs a real server id, independent of
// whatever set `persisted` — see removeMedia below.
const isValidObjectId = (id) => /^[a-f0-9]{24}$/i.test(id || "");

export default function ShowcaseAlbumsEditor({ albums, onChange, brandId }) {
  const [newAlbumName, setNewAlbumName] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRefs = useRef({});
  const hydratedRef = useRef(false);

  // ── Toast notifications ──
  // On top of the inline per-album/per-item error text below — pops a
  // toast for the same failure so it's noticeable even if that album/item
  // isn't currently in view (e.g. a 403 "plan doesn't include showcase
  // sections" while adding a new album).
  const [toastError, setToastError] = useState(null);
  const showError = (message) => {
    if (!message) return;
    setToastError({ message });
  };

  // ── Video poster queue ──
  // Confirmed from the add-media error response: "A video needs a poster
  // image. Attach one as 'thumbnail'..." — EVERY video needs one, not just
  // ones marked "Show in Video Clips" (that was the old, wrong gating).
  // Picked videos are queued here and uploaded one at a time through
  // VideoUploadModal, which collects the required poster (+ the optional
  // clips flag) before the request is ever sent — see handleFiles /
  // handleVideoConfirm / handleVideoCancel below.
  const [videoQueue, setVideoQueue] = useState([]);
  const [videoModalBusy, setVideoModalBusy] = useState(false);
  const currentVideoJob = videoQueue[0] || null;

  // ── Prefill already-saved albums + their media in one call ──
  useEffect(() => {
    if (!brandId) {
      setLoading(false);
      return;
    }
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    (async () => {
      try {
        const res = await getBrandShowcase(brandId);
        const payload = res?.data ?? res ?? {};
        const sectionsRaw = payload.sections || payload.showcaseSections || (Array.isArray(payload) ? payload : []);

        const mapped = (Array.isArray(sectionsRaw) ? sectionsRaw : []).map((s) => ({
          id: s._id || `alb${albumIdCounter++}`,
          name: s.title || s.name || "",
          status: "idle",
          error: "",
          persisted: true,
          media: (s.medias || s.media || []).map((m) => {
            const rawUrl = m.url || m.mediaUrl || m.path || "";
            return {
              id: m._id || `sm${showcaseMediaIdCounter++}`,
              // FIX: server sends "PHOTO"/"VIDEO" (uppercase). Lowercase it
              // so it matches the "video"/"image" checks used everywhere
              // else in this component. Only fall back to sniffing the
              // file extension if the server didn't send a type at all.
              type: m.type
                ? String(m.type).toLowerCase() === "photo"
                  ? "image"
                  : String(m.type).toLowerCase()
                : /\.(mp4|mov|webm)(\?|$)/i.test(rawUrl)
                  ? "video"
                  : "image",
              file: null,
              preview: rawUrl,
              thumbnail: m.thumbnail || rawUrl,
              month: m.month || "",
              isShowInVideoClips: !!m.isShowInVideoClips,
              status: "idle",
              error: "",
              persisted: true,
            };
          }),
        }));

        if (mapped.length) onChange(mapped);
      } catch (err) {
        // A brand-new outlet genuinely has no showcase yet — this call
        // failing just means "nothing saved so far", not a real error
        // worth alarming the merchant over. If real data exists, the
        // `onChange(mapped)` above already renders it; if it doesn't,
        // the plain "No albums yet" empty state below covers it. Still
        // logged to the console so a genuine failure (network/auth) is
        // visible to a developer.
        console.error("Couldn't load existing showcase:", err.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const canAddAlbum = albums.length < MAX_ALBUMS;

  const patchAlbum = (id, patch) => {
    onChange(albums.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const patchAlbumById = (list, id, patch) =>
    list.map((a) => (a.id === id ? { ...a, ...patch } : a));

  // ── Create Section ──────────────────────────────────────────
  const addAlbum = async (presetName) => {
    const trimmed = (presetName ?? newAlbumName).trim();
    if (!trimmed || !canAddAlbum) return;

    const tempId = `alb${albumIdCounter++}`;
    const optimisticAlbum = {
      id: tempId,
      name: trimmed,
      media: [],
      status: "creating",
      error: "",
      persisted: false,
    };
    onChange([...albums, optimisticAlbum]);
    setNewAlbumName("");
    setShowAddInput(false);

    try {
      const res = await createShowcaseSection({
        title: trimmed,
        description: "",
        sortOrder: albums.length + 1,
        sectionType: "CUSTOM",
      });
      const created = res?.data ?? res;
      // Swap the temp id for the real section id — everything downstream
      // (rename/upload/delete) keys off `album.id`, so this is the only
      // place that needs to know about the swap.
      onChange((prev) =>
        prev.map((a) =>
          a.id === tempId ? { ...a, id: created?._id || tempId, status: "idle", persisted: !!created?._id } : a
        )
      );
    } catch (err) {
      // Never actually created on the server — leaving it in the grid would
      // show a permanently-stuck card (rename is a no-op for an unpersisted
      // album, and "Upload" would just surface a second, misleading "still
      // saving" message). Drop it locally instead; the toast below already
      // tells the merchant what went wrong so they can just try again.
      onChange((prev) => prev.filter((a) => a.id !== tempId));
      showError(err.message);
    }
  };

  // ── Rename Section (saved on blur, not per keystroke) ──────
  const renameAlbumLocal = (id, name) => patchAlbum(id, { name });

  const saveAlbumName = async (album) => {
    if (!album.persisted || !album.name.trim()) return;
    patchAlbum(album.id, { status: "saving", error: "" });
    try {
      await updateShowcaseSection(album.id, { title: album.name.trim() });
      patchAlbum(album.id, { status: "idle" });
    } catch (err) {
      patchAlbum(album.id, { status: "error", error: err.message });
      showError(err.message);
    }
  };

  // ── Delete Section ──────────────────────────────────────────
  const removeAlbum = async (album) => {
    if (!album.persisted) {
      // Was never created on the server (still creating, or create failed) —
      // safe to just drop it locally.
      onChange(albums.filter((a) => a.id !== album.id));
      return;
    }
    patchAlbum(album.id, { status: "deleting", error: "" });
    try {
      await deleteShowcaseSection(album.id);
      onChange((prev) => prev.filter((a) => a.id !== album.id));
    } catch (err) {
      patchAlbum(album.id, { status: "error", error: err.message });
      showError(err.message);
    }
  };

  const triggerUpload = (id) => fileInputRefs.current[id]?.click();

  // ── Add Media to a Section ──────────────────────────────────
  const handleFiles = async (album, e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;

    if (!album.persisted) {
      // Album is still being created (or failed) — nothing to upload to yet.
      patchAlbum(album.id, { error: "This album is still saving — wait a moment and try again." });
      return;
    }

    const videoOnly = isVideoOnlyAlbum(album.name);
    const currentVideoCount = album.media.filter((m) => m.type === "video").length;
    const remainingItemSlots = MAX_ITEMS_PER_ALBUM - album.media.length;

    const newMedia = [];
    let videosSoFar = currentVideoCount;
    for (const file of picked) {
      if (newMedia.length >= remainingItemSlots) break;
      const isVideo = videoOnly || file.type.startsWith("video");
      if (videoOnly && !file.type.startsWith("video")) continue; // (no longer used — kept for a future video-only album type)
      if (isVideo) {
        if (videosSoFar >= MAX_VIDEOS_PER_ALBUM) continue;
        videosSoFar += 1;
      }
      newMedia.push({
        id: `sm${showcaseMediaIdCounter++}`,
        type: isVideo ? "video" : "image",
        file,
        preview: URL.createObjectURL(file),
        month: "",
        isShowInVideoClips: false,
        // Videos wait for a required poster — see VideoUploadModal /
        // handleVideoConfirm below (backend: "A video needs a poster
        // image"). Photos have nothing to wait for and upload right away.
        status: isVideo ? "pending-poster" : "uploading",
        error: "",
        persisted: false,
      });
    }

    if (!newMedia.length) return;

    // Show the thumbnails immediately (optimistic), then upload.
    onChange((prev) =>
      prev.map((a) => (a.id === album.id ? { ...a, media: [...a.media, ...newMedia] } : a))
    );

    const photoItems = newMedia.filter((m) => m.type === "image");
    const videoItems = newMedia.filter((m) => m.type === "video");

    if (videoItems.length) {
      setVideoQueue((prev) => [...prev, ...videoItems.map((media) => ({ albumId: album.id, media }))]);
    }
    if (photoItems.length) {
      await uploadMediaBatch(album.id, photoItems, { isShowInVideoClips: false, thumbnail: null });
    }
  };

  // ── Shared upload call for a batch of already-staged media items ────
  // Used for photo batches (handleFiles) and single-video uploads
  // (handleVideoConfirm) alike.
  const uploadMediaBatch = async (albumId, items, { isShowInVideoClips, thumbnail }) => {
    try {
      const res = await addShowcaseMedia(
        albumId,
        items.map((m) => m.file),
        { isShowInVideoClips, thumbnail }
      );
      // CONFIRMED real response shape (add-media): `data.medias[]`, each
      // entry { type, media: { url, thumbnail, ... }, title, altText,
      // sortOrder, isActive, isShowInVideoClips } — NOT the flat
      // { _id, url, thumbnail } shape get-brand-showcase returns, and it
      // carries no id at all. We line the returned items up by position
      // (server appends new media to the end of the section's medias
      // array) the same way as before, just reading the nested `media`
      // object for url/thumbnail now.
      const updatedSection = res?.data ?? res;
      const serverMedias = Array.isArray(updatedSection?.medias) ? updatedSection.medias : null;

      onChange((prev) =>
        prev.map((a) => {
          if (a.id !== albumId) return a;
          const tempIds = new Set(items.map((m) => m.id));
          let matchIndex = 0;
          return {
            ...a,
            media: a.media.map((m) => {
              if (!tempIds.has(m.id)) return m;
              const serverMatch = serverMedias?.slice(-items.length)[matchIndex];
              matchIndex += 1;
              // A present entry at this position IS the success signal now
              // (there's no `_id` to check) — anything missing (server
              // silently rejected this one file) is a genuine failed
              // upload.
              // ⚠️ No id to swap in for delete/update — until the backend
              // adds one here, removeMedia's isValidObjectId check falls
              // back to a local-only remove for a freshly uploaded item
              // (safe, just means a reload is needed to delete it for real).
              if (!serverMatch) {
                return { ...m, status: "error", error: "Upload didn't complete for this file — remove and try again." };
              }
              const mediaData = serverMatch.media || {};
              return {
                ...m,
                status: "idle",
                persisted: true,
                preview: mediaData.url || m.preview,
                thumbnail: mediaData.thumbnail || m.thumbnail,
                type: serverMatch.type
                  ? String(serverMatch.type).toLowerCase() === "photo"
                    ? "image"
                    : String(serverMatch.type).toLowerCase()
                  : m.type,
                isShowInVideoClips:
                  serverMatch.isShowInVideoClips !== undefined
                    ? !!serverMatch.isShowInVideoClips
                    : m.isShowInVideoClips,
              };
            }),
          };
        })
      );
    } catch (err) {
      onChange((prev) =>
        prev.map((a) => {
          if (a.id !== albumId) return a;
          const tempIds = new Set(items.map((m) => m.id));
          return {
            ...a,
            media: a.media.map((m) => (tempIds.has(m.id) ? { ...m, status: "error", error: err.message } : m)),
          };
        })
      );
      showError(err.message);
    }
  };

  // ── Video poster modal handlers ──────────────────────────────
  const handleVideoConfirm = async ({ poster, isShowInVideoClips }) => {
    if (!currentVideoJob) return;
    setVideoModalBusy(true);
    await uploadMediaBatch(currentVideoJob.albumId, [currentVideoJob.media], {
      isShowInVideoClips,
      thumbnail: poster,
    });
    setVideoModalBusy(false);
    setVideoQueue((prev) => prev.slice(1));
  };

  const handleVideoCancel = () => {
    if (!currentVideoJob) return;
    // No poster, no upload — the backend rejects a video without one, so
    // there's nothing to keep; drop the staged item locally.
    onChange((prev) =>
      prev.map((a) =>
        a.id === currentVideoJob.albumId
          ? { ...a, media: a.media.filter((m) => m.id !== currentVideoJob.media.id) }
          : a
      )
    );
    setVideoQueue((prev) => prev.slice(1));
  };

  // ── Delete a Media Item ──────────────────────────────────────
  const removeMedia = async (albumId, media) => {
    // ⚠️ FIXED: was only `!media.persisted` — but a batch upload whose
    // response didn't include a real match for every file (see the
    // success-branch fix in handleFiles below) could end up with
    // `persisted: true` while `media.id` was still its local temp id
    // (e.g. "sm42", not a real Mongo id). Calling deleteShowcaseMedia
    // with that fake id is exactly what the backend rejected as
    // "Params.mediaId contains an invalid value". Checking the id's own
    // shape here is a safety net independent of how `persisted` got set.
    if (!media.persisted || !isValidObjectId(media.id)) {
      // Never confirmed on the server (still uploading, or upload failed) —
      // safe to just drop it locally.
      onChange(
        albums.map((a) => (a.id === albumId ? { ...a, media: a.media.filter((m) => m.id !== media.id) } : a))
      );
      return;
    }

    onChange(
      albums.map((a) =>
        a.id === albumId
          ? { ...a, media: patchAlbumById(a.media, media.id, { status: "deleting", error: "" }) }
          : a
      )
    );

    try {
      await deleteShowcaseMedia(albumId, media.id);
      onChange((prev) =>
        prev.map((a) => (a.id === albumId ? { ...a, media: a.media.filter((m) => m.id !== media.id) } : a))
      );
    } catch (err) {
      onChange((prev) =>
        prev.map((a) =>
          a.id === albumId ? { ...a, media: patchAlbumById(a.media, media.id, { status: "error", error: err.message }) } : a
        )
      );
      showError(err.message);
    }
  };

  // Month tagging (Ambience-style albums) is a local/UI concept — it wasn't
  // part of the confirmed add-media request in the Postman screenshot, so
  // it's kept client-side only for now. If your backend later accepts a
  // "month" field on a media item, wire it up here with
  // updateShowcaseMedia(albumId, mediaId, { month }).
  const setMediaMonth = (albumId, mediaId, month) => {
    onChange(
      albums.map((a) =>
        a.id === albumId
          ? { ...a, media: a.media.map((m) => (m.id === mediaId ? { ...m, month } : m)) }
          : a
      )
    );
  };

  return (
    <>
      <div>
        {canAddAlbum ? (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-start items-center mb-3">
              {QUICK_ALBUM_PRESETS.filter(
                (p) => !albums.some((a) => a.name.trim().toLowerCase() === p.toLowerCase())
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setNewAlbumName(preset);
                    setShowAddInput(true);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  + {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                + Add More
              </button>
            </div>

            {showAddInput && (
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  autoFocus
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAlbum();
                    }
                    if (e.key === "Escape") {
                      setShowAddInput(false);
                      setNewAlbumName("");
                    }
                  }}
                  placeholder="eg : Gallery Photo"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 placeholder:text-gray-400"
                />
                <button
                  onClick={() => addAlbum()}
                  disabled={!newAlbumName.trim()}
                  className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${newAlbumName.trim()
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  Add Album
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInput(false);
                    setNewAlbumName("");
                  }}
                  className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-600 font-semibold mb-4">Maximum {MAX_ALBUMS} albums reached.</p>
        )}

        {loading ? (
          <p className="text-xs text-gray-400 mb-4">Loading saved albums…</p>
        ) : (
          albums.length === 0 && (
            <p className="text-xs text-gray-400 mb-4">
              No albums yet. Add one above — e.g. "Gallery Photo", "Menu Photo", "Ambience Photo", "Event Photo".
            </p>
          )
        )}

        <div className="space-y-5">
          {albums.map((album) => {
            const videoOnly = isVideoOnlyAlbum(album.name);
            const monthly = isMonthlyAlbum(album.name);
            const videoCount = album.media.filter((m) => m.type === "video").length;
            const itemCount = album.media.length;
            const remainingItems = MAX_ITEMS_PER_ALBUM - itemCount;
            const remainingVideos = MAX_VIDEOS_PER_ALBUM - videoCount;
            const albumBusy = album.status === "creating" || album.status === "deleting";
            const canUpload = !albumBusy && remainingItems > 0 && (!videoOnly || remainingVideos > 0);

            return (
              <div key={album.id} className="rounded-xl p-4 bg-white dark:bg-gray-800">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <input
                    type="text"
                    value={album.name}
                    onChange={(e) => renameAlbumLocal(album.id, e.target.value)}
                    onBlur={() => saveAlbumName(album)}
                    disabled={albumBusy}
                    placeholder="Album name"
                    className="text-sm font-bold text-gray-900 dark:text-gray-100 outline-none bg-emerald-50 dark:bg-emerald-500/10 px-0.5 py-0.5 flex-1 disabled:opacity-50"
                  />
                  <button
                    onClick={() => removeAlbum(album)}
                    disabled={albumBusy}
                    className="text-xs font-semibold text-gray-400 hover:text-red-500 whitespace-nowrap disabled:opacity-50"
                  >
                    {album.status === "deleting" ? "Removing…" : "Remove Album"}
                  </button>
                </div>

                {album.status === "creating" && (
                  <p className="text-xs text-emerald-500 font-semibold mb-2">Creating album…</p>
                )}
                {album.status === "saving" && (
                  <p className="text-xs text-emerald-500 font-semibold mb-2">Saving name…</p>
                )}
                {album.status === "error" && album.error && (
                  <p className="text-xs text-red-500 font-semibold mb-2">{album.error}</p>
                )}

                <p className="text-xs text-gray-500 mb-3">
                  {videoOnly ? "Video only. " : "Photos & videos. "}
                  At least {MIN_ITEMS_PER_ALBUM} {videoOnly ? "videos" : "photos or videos"} required · Max {MAX_ITEMS_PER_ALBUM} items · Max {MAX_VIDEOS_PER_ALBUM} videos
                  {monthly ? " · Tag each item with a month" : ""}
                </p>

                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <button
                    onClick={() => triggerUpload(album.id)}
                    disabled={!canUpload}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${canUpload ? "bg-[#1a1a2e] text-white hover:bg-[#2d2d5e]" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    Upload {videoOnly ? "Video" : "Photo / Video"}
                  </button>
                  <input
                    ref={(el) => (fileInputRefs.current[album.id] = el)}
                    type="file"
                    accept={videoOnly ? "video/*" : "image/*,video/*"}
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(album, e)}
                  />

                  <span className="text-xs text-gray-400">
                    {itemCount}/{MAX_ITEMS_PER_ALBUM} items · {videoCount}/{MAX_VIDEOS_PER_ALBUM} videos
                  </span>
                </div>

                {itemCount < MIN_ITEMS_PER_ALBUM ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-3">
                    Add at least {MIN_ITEMS_PER_ALBUM} {videoOnly ? "videos" : "photos or videos"} to this album
                    {itemCount > 0 ? ` (${MIN_ITEMS_PER_ALBUM - itemCount} more needed)` : ""}.
                  </p>
                ) : null}
                {itemCount > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {album.media.map((m) => (
                      <div key={m.id} className="relative w-24 rounded-xl overflow-hidden group shadow-sm bg-gray-100 dark:bg-gray-700">
                        <button onClick={() => setPreviewItem(m)} className="w-24 h-24 block" title="Preview">
                          {m.type === "video" ? (
                            <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
                              {m.thumbnail && (
                                <img
                                  src={m.thumbnail}
                                  alt="thumb"
                                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                                />
                              )}
                              <svg className="relative z-10 w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                          ) : (
                            <img src={m.preview} alt="thumb" className="w-full h-full object-cover" />
                          )}
                        </button>

                        {(m.status === "uploading" || m.status === "deleting") && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5">
                            <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <span className="text-[9px] font-semibold text-white">
                              {m.status === "uploading" ? "Uploading…" : "Removing…"}
                            </span>
                          </div>
                        )}
                        {m.status === "pending-poster" && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-0.5 px-1.5 text-center">
                            <span className="text-[9px] font-semibold text-white leading-tight">Add a poster to upload</span>
                          </div>
                        )}

                        <button
                          onClick={() => removeMedia(album.id, m)}
                          disabled={m.status === "uploading" || m.status === "deleting"}
                          aria-label="Remove"
                          title="Remove"
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-sm transition-all hover:bg-rose-600 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                        {m.isShowInVideoClips && (
                          <span className="absolute top-1.5 left-1.5 text-[8px] font-bold text-white bg-emerald-600 rounded-full px-1.5 py-0.5 shadow-sm">
                            Clip
                          </span>
                        )}
                        {monthly && (
                          <div className="bg-white dark:bg-gray-800">
                            <Select
                              compact
                              value={m.month}
                              onChange={(value) => setMediaMonth(album.id, m.id, value)}
                              options={SHOWCASE_MONTHS.map((mo) => ({ value: mo, label: mo }))}
                              placeholder="Month"
                              className="bg-transparent text-gray-700 dark:text-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {previewItem && (
          <MediaPreviewModal src={previewItem.preview} type={previewItem.type} onClose={() => setPreviewItem(null)} />
        )}
        {currentVideoJob && (
          <VideoUploadModal
            videoPreviewUrl={currentVideoJob.media.preview}
            submitting={videoModalBusy}
            onCancel={handleVideoCancel}
            onConfirm={handleVideoConfirm}
          />
        )}
      </div>
      <ErrorToast error={toastError} onDismiss={() => setToastError(null)} />
    </>
  );
}
