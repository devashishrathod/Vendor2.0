import { useState } from "react";

import ShowcaseSection from "../components/ShowcaseSection";
import AddShowcaseSectionModal from "../components/AddShowcaseSectionModal";
import useBrandShowcase from "../hooks/useBrandShowcase";
import {
  createShowcaseSectionWithMedia,
  addShowcaseMedia,
  deleteShowcaseMedia,
  deleteShowcaseSection,
  updateShowcaseSection,
  reorderShowcaseSections,
  replaceShowcaseMedia,
  reorderShowcaseMedia,
  updateShowcaseMediaDetails,
} from "../services/brandApi";

// Moves the item at `id` (matched by `idKey`) to 1-based `newPosition`
// within `list`, clamping to the list's actual bounds. Returns the SAME
// array reference when the position doesn't actually change (already
// there, or an invalid id) — callers treat that as a no-op.
function moveToPosition(list, id, idKey, newPositionRaw) {
  const idx = list.findIndex((item) => item[idKey] === id);
  if (idx === -1) return list;

  const newPosition = Math.min(Math.max(1, Number(newPositionRaw) || 1), list.length);
  const newIdx = newPosition - 1;
  if (newIdx === idx) return list;

  const next = [...list];
  const [moved] = next.splice(idx, 1);
  next.splice(newIdx, 0, moved);
  return next;
}

/**
 * ShowcasePage
 * "Showcase Details" tab — live sections + media from
 * GET /showcase/get-brand-showcase/:brandId, with add/edit/delete/reorder
 * for sections, and add/replace/delete/reorder for their media, all wired
 * to the real API.
 */
const ShowcasePage = ({ brandId }) => {
  const { data, loading, error, reload } = useBrandShowcase(brandId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Only the very first load (no data yet) shows this — every reload()
  // afterwards (drag reorder, add/delete/edit) also flips `loading` back to
  // true, but the page must keep showing the CURRENT sections while that
  // background refetch runs instead of unmounting them, otherwise every
  // action looks like the whole page flashes/reloads.
  if (loading && !data) {
    return <p className="text-sm text-gray-400">Loading showcase…</p>;
  }

  const sections = data?.sections || [];

  const showcase = {
    subtitle: "View and update the photos & videos shown on your listing.",
    groups: sections.map((s) => ({
      id: s._id,
      title: s.title,
      subtitle: s.description || `${s.photoCount || 0} photos · ${s.videoCount || 0} videos`,
      medias: s.medias || [],
      // Defaults to true (visible) — a brand-new section with no explicit
      // isVisible from the API should show up for customers by default.
      isVisible: s.isVisible !== false,
    })),
  };

  const handleAddMore = () => setShowAddModal(true);
const handleCreateSection = async ({ title, description, files, isShowInVideoClips, thumbnail }) => {
  const { mediaError } = await createShowcaseSectionWithMedia(
    { title, description },
    files,
    { isShowInVideoClips, thumbnail }   // ✅ ye add karo — mediaOptions ke through addShowcaseMedia tak jayega
  );
  if (mediaError) {
    setActionError(mediaError.message);
  }
  reload();
};

  const handleAddMedia = async (sectionId, files, options) => {
    setActionError(null);
    try {
      await addShowcaseMedia(sectionId, files, options);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDeleteMedia = async (sectionId, mediaId) => {
    setActionError(null);
    try {
      await deleteShowcaseMedia(sectionId, mediaId);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    setActionError(null);
    try {
      await deleteShowcaseSection(sectionId);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // "Show in Clips" visibility toggle on the section header — PUT
  // /showcase/section/update/:id with just { isVisible }, the same
  // update-section endpoint the title/description edit modal already uses.
  const handleToggleSectionVisibility = async (sectionId, isVisible) => {
    setActionError(null);
    try {
      await updateShowcaseSection(sectionId, { isVisible });
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleEditSection = (sectionId) => setEditingSectionId(sectionId);

  const handleEditSectionSubmit = async ({ title, description }) => {
    await updateShowcaseSection(editingSectionId, { title, description });
    reload();
  };

  const handleSetSectionOrder = async (sectionId, newPositionRaw) => {
    setActionError(null);
    const reordered = moveToPosition(sections, sectionId, "_id", newPositionRaw);
    if (reordered === sections) return;

    try {
      await reorderShowcaseSections(brandId, reordered.map((s, i) => ({ id: s._id, sortOrder: i + 1 })));
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleReplaceMedia = async (sectionId, mediaId, file) => {
    setActionError(null);
    try {
      await replaceShowcaseMedia(sectionId, mediaId, { file });
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // "Edit" action on a media item's preview modal — title/altText for
  // either type, plus a thumbnail (poster image) when editing a video.
  const handleUpdateMediaDetails = async (sectionId, mediaId, { title, altText, thumbnail }) => {
    setActionError(null);
    try {
      await updateShowcaseMediaDetails(sectionId, mediaId, { title, altText, thumbnail });
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Video 3-dot menu's "Show in Video Clips" checkbox — flips one existing
  // media item's isShowInVideoClips flag (see replaceShowcaseMedia's
  // comment for why this reuses the replace-media endpoint).
  const handleToggleMediaClip = async (sectionId, mediaId, isShowInVideoClips) => {
    setActionError(null);
    try {
      await replaceShowcaseMedia(sectionId, mediaId, { isShowInVideoClips });
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleSetMediaOrder = async (sectionId, mediaId, newPositionRaw) => {
    setActionError(null);
    const section = sections.find((s) => s._id === sectionId);
    const mediaList = section?.medias || [];
    const reordered = moveToPosition(mediaList, mediaId, "_id", newPositionRaw);
    if (reordered === mediaList) return;

    try {
      await reorderShowcaseMedia(
        sectionId,
        reordered.map((m, i) => ({ id: m._id, sortOrder: i + 1 }))
      );
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const editingSection = sections.find((s) => s._id === editingSectionId) || null;

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-500">
          Couldn't load live data ({error}). Showing cached details.
        </p>
      )}
      {actionError && (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-500">{actionError}</p>
      )}

      <ShowcaseSection
        showcase={showcase}
        onAddMore={handleAddMore}
        onAddMedia={handleAddMedia}
        onDeleteMedia={handleDeleteMedia}
        onReplaceMedia={handleReplaceMedia}
        onUpdateMediaDetails={handleUpdateMediaDetails}
        onSetMediaOrder={handleSetMediaOrder}
        onEditSection={handleEditSection}
        onDeleteSection={handleDeleteSection}
        onSetSectionOrder={handleSetSectionOrder}
        onToggleVisibility={handleToggleSectionVisibility}
        onToggleMediaClip={handleToggleMediaClip}
      />

      {showAddModal && (
        <AddShowcaseSectionModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateSection}
        />
      )}

      {editingSection && (
        <AddShowcaseSectionModal
          mode="edit"
          section={editingSection}
          onClose={() => setEditingSectionId(null)}
          onSubmit={handleEditSectionSubmit}
        />
      )}
    </div>
  );
};

export default ShowcasePage;