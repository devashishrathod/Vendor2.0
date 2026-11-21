import { useCallback, useEffect, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { ImagePlus, LayoutGrid, Images, Layers, Play, X, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import ShowcaseGroup from "./ShowcaseGroup";
import DisabledHint from "@/components/common/DisabledHint";

// Full-screen look through the Gallery view — view only, ← / → to move.
function GalleryViewer({ items, index, onIndex, onClose }) {
  const item = items[index];
  const count = items.length;
  const go = useCallback((step) => onIndex((index + step + count) % count), [index, count, onIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  if (!item) return null;
  const navBtn = "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
        <X size={16} />
      </button>
      <div onClick={(e) => e.stopPropagation()} className="flex h-[78vh] w-full max-w-4xl items-center justify-center">
        {item.type === "VIDEO" ? (
          <video key={item.key} src={item.url} poster={item.thumbnail || undefined} controls autoPlay className="max-h-full max-w-full rounded-xl" />
        ) : (
          <img key={item.key} src={item.url} alt={item.altText || ""} className="max-h-full max-w-full rounded-xl object-contain" />
        )}
      </div>
      {count > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" className={`${navBtn} left-4`}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" className={`${navBtn} right-4`}>
            <ChevronRight size={18} />
          </button>
        </>
      )}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
        <span className="capitalize">{item.album}</span> · {index + 1} / {count}
      </p>
    </div>
  );
}

// Gallery — every section's media in one grid (not split by section).
// View only; editing stays in the Albums view, where each change goes to
// the right section.
function ShowcaseGallery({ groups }) {
  const [viewIndex, setViewIndex] = useState(null);
  const items = groups.flatMap((g) =>
    (g.medias || [])
      .filter((m) => m?.url)
      .map((m, i) => ({ ...m, key: `${g.id}:${m._id ?? i}`, album: g.title || "Untitled" }))
  );

  if (!items.length) {
    return (
      <p className="mt-5 rounded-xl bg-white py-10 text-center text-xs text-gray-400 dark:bg-gray-800">
        No photos or videos in any section yet.
      </p>
    );
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
        {items.map((m, i) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setViewIndex(i)}
            title={m.album}
            className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:bg-gray-700"
          >
            {m.type === "VIDEO" ? (
              <>
                <video src={`${m.url}#t=0.1`} poster={m.thumbnail || undefined} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  <Play size={9} fill="currentColor" /> Video
                </span>
              </>
            ) : (
              <img src={m.thumbnail || m.url} alt={m.altText || ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            )}
            {/* Which section it's from, on hover */}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-4 text-left text-[10.5px] font-medium capitalize text-white opacity-0 transition-opacity group-hover:opacity-100">
              {m.album}
            </span>
          </button>
        ))}
      </div>
      {viewIndex != null && (
        <GalleryViewer items={items} index={viewIndex} onIndex={setViewIndex} onClose={() => setViewIndex(null)} />
      )}
    </>
  );
}

// Collections view: 4 tiles per card, the 4th becomes "+N".
const COLLECTION_TILES = 4;

// Media of one section as GalleryViewer items.
const toViewerItems = (group) =>
  (group.medias || [])
    .filter((m) => m?.url)
    .map((m, i) => ({ ...m, key: `${group.id}:${m._id ?? i}`, album: group.title || "Untitled" }));

// Collections — one small card per section: title, photo / video counts
// and a 2×2 of its first items. With more than 4, the 4th tile shows that
// item blurred under "+N". View only (same as the admin panel's Collections
// view); editing stays in the Albums view.
function ShowcaseCollections({ groups }) {
  // { items, index } — the section being viewed full-screen.
  const [viewing, setViewing] = useState(null);

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {groups.map((group) => {
          const items = toViewerItems(group);
          const photos = items.filter((m) => m.type !== "VIDEO").length;
          const videos = items.length - photos;
          const overflow = items.length > COLLECTION_TILES;
          const tiles = items.slice(0, COLLECTION_TILES);
          const moreCount = items.length - (COLLECTION_TILES - 1);
          const open = (index) => setViewing({ items, index });

          return (
            <div key={group.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800">
              <button
                type="button"
                onClick={() => items.length && open(0)}
                className="flex items-center justify-between gap-2 p-2.5 pb-2 text-left"
              >
                <div className="min-w-0">
                  <p className={`truncate text-[12.5px] font-bold capitalize ${group.title ? "text-gray-900 dark:text-gray-100" : "italic text-gray-400"}`}>
                    {group.title || "Untitled"}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1">
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-50 px-1.5 py-px text-[10px] font-semibold text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                      <Images size={9} /> {photos}
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-1.5 py-px text-[10px] font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                      <Play size={9} /> {videos}
                    </span>
                    {!group.isVisible && (
                      <span title="Hidden from customers" className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    )}
                  </div>
                </div>
                {items.length > 0 && (
                  <span title="View all" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    <LayoutGrid size={11} />
                  </span>
                )}
              </button>

              {items.length ? (
                <div className="grid grid-cols-2 gap-1 px-2.5 pb-2.5">
                  {tiles.map((m, i) => {
                    const isMore = overflow && i === COLLECTION_TILES - 1;
                    const isVideo = m.type === "VIDEO";
                    const src = isVideo ? m.thumbnail : m.url;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => open(i)}
                        aria-label={isMore ? `View all ${items.length} in ${group.title || "this section"}` : m.altText || (isVideo ? "Video" : "Photo")}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:bg-gray-700"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={m.altText || ""}
                            loading="lazy"
                            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isMore ? "scale-110 opacity-50 blur-[2px]" : ""}`}
                          />
                        ) : (
                          <video src={`${m.url}#t=0.1`} muted playsInline preload="metadata" className={`h-full w-full object-cover ${isMore ? "opacity-50 blur-[2px]" : ""}`} />
                        )}
                        {isMore ? (
                          <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white">
                            <span className="text-[17px] font-bold leading-none">+{moreCount}</span>
                            <span className="mt-0.5 text-[10px] font-medium text-white/80">View all</span>
                          </span>
                        ) : (
                          isVideo && (
                            <span className="pointer-events-none absolute bottom-1 left-1 flex items-center rounded bg-black/70 p-0.5 text-white">
                              <Play size={9} fill="currentColor" />
                            </span>
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mx-2.5 mb-2.5 flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl bg-gray-50 py-8 dark:bg-gray-900/40">
                  <Images size={18} className="text-gray-400" />
                  <p className="text-[12px] text-gray-500">No media yet</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {viewing && (
        <GalleryViewer
          items={viewing.items}
          index={viewing.index}
          onIndex={(index) => setViewing((v) => ({ ...v, index }))}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}

const ShowcaseSection = ({
  showcase,
  onAddMore,
  onAddMedia,
  onDeleteMedia,
  onReplaceMedia,
  onUpdateMediaDetails,
  onSetMediaOrder,
  onEditSection,
  onDeleteSection,
  onSetSectionOrder,
  onToggleVisibility,
  onToggleMediaClip,
  sectionLimit = null,
  atSectionLimit = false,
}) => {
  // "collections" (default) = one small card per section; "gallery" = all
  // media in one grid; "albums" = full editable sections.
  const [view, setView] = useState("collections");

  // Drag-and-drop reorder for sections — computes the dragged section's new
  // 1-based position and hands it to the SAME onSetSectionOrder(id,
  // position) the earlier number-input version used (which itself calls
  // the confirmed PUT /showcase/section/:id/reorder via ShowcasePage.jsx),
  // just driven by a drag gesture instead of typing a number.
  const handleSectionDragEnd = (event) => {
    if (event.canceled || !onSetSectionOrder) return;
    const draggedId = event.operation.source?.id;
    if (draggedId == null) return;
    const idItems = showcase.groups.map((g) => ({ id: g.id }));
    const moved = move(idItems, event);
    const newIndex = moved.findIndex((item) => item.id === draggedId);
    if (newIndex === -1) return;
    onSetSectionOrder(draggedId, newIndex + 1);
  };

  const totalPhotos = showcase.groups.reduce(
    (sum, g) => sum + (g.medias || []).filter((m) => m.type === "PHOTO").length,
    0
  );
  const totalVideos = showcase.groups.reduce(
    (sum, g) => sum + (g.medias || []).filter((m) => m.type === "VIDEO").length,
    0
  );

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Showcase
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{showcase.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(totalPhotos > 0 || totalVideos > 0) && (
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {totalPhotos} Photo{totalPhotos !== 1 ? "s" : ""} · {totalVideos} Video{totalVideos !== 1 ? "s" : ""}
            </span>
          )}
          {showcase.groups.length > 0 && (
            <div className="flex items-center rounded-full bg-gray-100 p-0.5 dark:bg-gray-700">
              {[
                ["collections", Layers, "Collections"],
                ["gallery", LayoutGrid, "Gallery"],
                ["albums", Images, "Albums"],
              ].map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  aria-pressed={view === key}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    view === key
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
          )}
          <DisabledHint
            show={atSectionLimit}
            message={`Plan limit reached — ${showcase.groups.length}/${sectionLimit} sections. Upgrade or delete one to add more.`}
          >
            <button
              type="button"
              onClick={onAddMore}
              disabled={atSectionLimit}
              className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200 disabled:pointer-events-none disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            >
              {atSectionLimit ? <Lock size={13} /> : <ImagePlus size={14} />} Add Showcase
              {sectionLimit != null && (
                <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-[10.5px] tabular-nums dark:bg-white/10">
                  {showcase.groups.length}/{sectionLimit}
                </span>
              )}
            </button>
          </DisabledHint>
        </div>
      </div>

      {view === "collections" && showcase.groups.length > 0 ? (
        <ShowcaseCollections groups={showcase.groups} />
      ) : view === "gallery" && showcase.groups.length > 0 ? (
        <ShowcaseGallery groups={showcase.groups} />
      ) : (
      <DragDropProvider onDragEnd={handleSectionDragEnd}>
        <div className="mt-5 space-y-5">
          {showcase.groups.map((group, index) => (
            <ShowcaseGroup
              key={group.id}
              group={group}
              index={index}
              onAddMedia={onAddMedia}
              onDeleteMedia={onDeleteMedia}
              onReplaceMedia={onReplaceMedia}
              onUpdateMediaDetails={onUpdateMediaDetails}
              onSetMediaOrder={onSetMediaOrder}
              onEditSection={onEditSection}
              onDeleteSection={onDeleteSection}
              onToggleVisibility={onToggleVisibility}
              onToggleMediaClip={onToggleMediaClip}
            />
          ))}
        </div>
      </DragDropProvider>
      )}
    </section>
  );
};

export default ShowcaseSection;