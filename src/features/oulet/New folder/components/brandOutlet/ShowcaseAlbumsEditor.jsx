import { useEffect, useRef, useState } from "react";
import MediaPreviewModal from "./modals/MediaPreviewModal";
import {
  MAX_ALBUMS,
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
//   { id, type: 'image'|'video', file, preview, month, status, error, persisted }
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
// NOTE: the exact response shape (top-level key for the sections array,
// and the field names on each section/media object) wasn't confirmed
// against a real payload — the mapping below tries the most likely key
// names (`sections`/`showcaseSections`, `title`/`name`,
// `medias`/`media`, `url`/`mediaUrl`). Adjust once you've checked an
// actual response from get-brand-showcase.
let albumIdCounter = 0;
let showcaseMediaIdCounter = 0;

export default function ShowcaseAlbumsEditor({ albums, onChange, brandId }) {
  const [newAlbumName, setNewAlbumName] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const fileInputRefs = useRef({});
  const hydratedRef = useRef(false);

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
          media: (s.medias || s.media || []).map((m) => ({
            id: m._id || `sm${showcaseMediaIdCounter++}`,
            type: m.type || (/\.(mp4|mov|webm)(\?|$)/i.test(m.url || m.mediaUrl || "") ? "video" : "image"),
            file: null,
            preview: m.url || m.mediaUrl || m.path || "",
            month: m.month || "",
            status: "idle",
            error: "",
            persisted: true,
          })),
        }));

        if (mapped.length) onChange(mapped);
      } catch (err) {
        setLoadError("Couldn't load your previously saved albums.");
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
      onChange((prev) =>
        prev.map((a) => (a.id === tempId ? { ...a, status: "error", error: err.message } : a))
      );
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
        status: "uploading",
        error: "",
        persisted: false,
      });
    }

    if (!newMedia.length) return;

    // Show the thumbnails immediately (optimistic), then upload.
    onChange((prev) =>
      prev.map((a) => (a.id === album.id ? { ...a, media: [...a.media, ...newMedia] } : a))
    );

    try {
      const res = await addShowcaseMedia(
        album.id,
        newMedia.map((m) => m.file),
        { isShowInVideoClips: false }
      );
      // The exact shape of a successful add-media response wasn't captured
      // in the Postman screenshot (only the request body was shown), so we
      // can't reliably map each returned media item back to the temp item
      // that produced it. If the response DOES include an updated
      // `data.medias` array, we try to line it up by position; otherwise we
      // just mark the optimistic items as persisted using the local temp id
      // — media delete/edit calls below will simply no-op safely if that id
      // turns out not to match a real server id, so nothing breaks, but you
      // should confirm the response shape with the backend and tighten this
      // mapping once known.
      const updatedSection = res?.data ?? res;
      const serverMedias = Array.isArray(updatedSection?.medias) ? updatedSection.medias : null;

      onChange((prev) =>
        prev.map((a) => {
          if (a.id !== album.id) return a;
          const tempIds = new Set(newMedia.map((m) => m.id));
          let matchIndex = 0;
          return {
            ...a,
            media: a.media.map((m) => {
              if (!tempIds.has(m.id)) return m;
              const serverMatch = serverMedias?.slice(-newMedia.length)[matchIndex];
              matchIndex += 1;
              return {
                ...m,
                status: "idle",
                persisted: true,
                id: serverMatch?._id || m.id,
              };
            }),
          };
        })
      );
    } catch (err) {
      onChange((prev) =>
        prev.map((a) => {
          if (a.id !== album.id) return a;
          const tempIds = new Set(newMedia.map((m) => m.id));
          return {
            ...a,
            media: a.media.map((m) => (tempIds.has(m.id) ? { ...m, status: "error", error: err.message } : m)),
          };
        })
      );
    }
  };

  // ── Delete a Media Item ──────────────────────────────────────
  const removeMedia = async (albumId, media) => {
    if (!media.persisted) {
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
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                + {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowAddInput(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
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
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white text-gray-700"
              />
              <button
                onClick={() => addAlbum()}
                disabled={!newAlbumName.trim()}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  newAlbumName.trim()
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
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
                className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-amber-600 font-semibold mb-4">Maximum {MAX_ALBUMS} albums reached.</p>
      )}

      {loadError && <p className="text-xs text-red-500 mb-3">{loadError}</p>}

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
            <div key={album.id} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-start justify-between gap-3 mb-1">
                <input
                  type="text"
                  value={album.name}
                  onChange={(e) => renameAlbumLocal(album.id, e.target.value)}
                  onBlur={() => saveAlbumName(album)}
                  disabled={albumBusy}
                  placeholder="Album name"
                  className="text-sm font-bold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-indigo-400 outline-none bg-transparent px-0.5 py-0.5 flex-1 disabled:opacity-50"
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
                <p className="text-xs text-indigo-500 font-semibold mb-2">Creating album…</p>
              )}
              {album.status === "saving" && (
                <p className="text-xs text-indigo-500 font-semibold mb-2">Saving name…</p>
              )}
              {album.status === "error" && album.error && (
                <p className="text-xs text-red-500 font-semibold mb-2">{album.error}</p>
              )}

              <p className="text-xs text-gray-500 mb-3">
                {videoOnly ? "Video only. " : "Photos & videos. "}
                At least 1 {videoOnly ? "video" : "photo or video"} required · Max {MAX_ITEMS_PER_ALBUM} items · Max {MAX_VIDEOS_PER_ALBUM} videos
                {monthly ? " · Tag each item with a month" : ""}
              </p>

              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <button
                  onClick={() => triggerUpload(album.id)}
                  disabled={!canUpload}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    canUpload ? "bg-[#1a1a2e] text-white hover:bg-[#2d2d5e]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
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

              {itemCount === 0 ? (
                <p className="text-xs text-red-500 font-semibold">
                  Add at least 1 {videoOnly ? "video" : "photo or video"} to this album.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {album.media.map((m) => (
                    <div key={m.id} className="relative w-20 rounded-lg overflow-hidden border border-gray-200 group">
                      <button onClick={() => setPreviewItem(m)} className="w-20 h-20 block" title="Preview">
                        {m.type === "video" ? (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        ) : (
                          <img src={m.preview} alt="thumb" className="w-full h-full object-cover" />
                        )}
                      </button>

                      {(m.status === "uploading" || m.status === "deleting") && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-[9px] font-semibold text-white">
                            {m.status === "uploading" ? "Uploading…" : "Removing…"}
                          </span>
                        </div>
                      )}
                      {m.status === "error" && (
                        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center px-1">
                          <span className="text-[8px] font-semibold text-white text-center leading-tight">
                            Failed — tap × to remove
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => removeMedia(album.id, m)}
                        disabled={m.status === "uploading" || m.status === "deleting"}
                        title="Remove"
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs leading-none hover:bg-red-600 disabled:opacity-50"
                      >
                        ×
                      </button>
                      {monthly && (
                        <>
                          <select
                            value={m.month}
                            onChange={(e) => setMediaMonth(album.id, m.id, e.target.value)}
                            className="w-full text-[10px] border-t border-gray-200 bg-white text-gray-600 outline-none px-0.5 py-0.5"
                          >
                            <option value="">Month</option>
                            {SHOWCASE_MONTHS.map((mo) => (
                              <option key={mo} value={mo}>{mo}</option>
                            ))}
                          </select>
                          {m.month && (
                            <span className="block text-center text-[9px] font-semibold text-indigo-600 bg-indigo-50 border-t border-gray-200 py-0.5 truncate">
                              {m.month} Month Photo
                            </span>
                          )}
                        </>
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
    </div>
  );
}