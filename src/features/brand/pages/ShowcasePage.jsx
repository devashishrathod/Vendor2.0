import React, { useState } from "react";

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
} from "../services/brandApi";

// Moves `mediaId` one step earlier/later among same-type (PHOTO/PHOTO or
// VIDEO/VIDEO) neighbors within the section's full (photos+videos combined)
// media list, preserving the relative order between the two types. Returns
// the same array reference when there's no same-type neighbor to swap with
// (already at that end) — callers treat that as a no-op.
function moveMediaWithinType(mediaList, mediaId, direction) {
  const idx = mediaList.findIndex((m) => m._id === mediaId);
  if (idx === -1) return mediaList;
  const type = mediaList[idx].type;

  let swapWith = -1;
  if (direction === "up") {
    for (let i = idx - 1; i >= 0; i -= 1) {
      if (mediaList[i].type === type) {
        swapWith = i;
        break;
      }
    }
  } else {
    for (let i = idx + 1; i < mediaList.length; i += 1) {
      if (mediaList[i].type === type) {
        swapWith = i;
        break;
      }
    }
  }
  if (swapWith === -1) return mediaList;

  const next = [...mediaList];
  [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
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

  if (loading) {
    return <p className="text-sm text-gray-400">Loading showcase…</p>;
  }

  const sections = data?.sections || [];

  const showcase = {
    subtitle: "View and update the photos & videos shown on your listing.",
    guidelinesLink: "#",
    groups: sections.map((s) => ({
      id: s._id,
      title: s.title,
      subtitle: s.description || `${s.photoCount || 0} photos · ${s.videoCount || 0} videos`,
      medias: s.medias || [],
    })),
  };

  const handleAddMore = () => setShowAddModal(true);
const handleCreateSection = async ({ title, description, files, isShowInVideoClips }) => {
  const { mediaError } = await createShowcaseSectionWithMedia(
    { title, description },
    files,
    { isShowInVideoClips }   // ✅ ye add karo — mediaOptions ke through addShowcaseMedia tak jayega
  );
  if (mediaError) {
    setActionError(mediaError.message);
  }
  reload();
};

  const handleAddMedia = async (sectionId, files) => {
    setActionError(null);
    try {
      await addShowcaseMedia(sectionId, files);
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

  const handleEditSection = (sectionId) => setEditingSectionId(sectionId);

  const handleEditSectionSubmit = async ({ title, description }) => {
    await updateShowcaseSection(editingSectionId, { title, description });
    reload();
  };

  const handleMoveSection = async (sectionId, direction) => {
    setActionError(null);
    const idx = sections.findIndex((s) => s._id === sectionId);
    if (idx === -1) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sections.length) return;

    const reordered = [...sections];
    [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];

    try {
      await reorderShowcaseSections(reordered.map((s, i) => ({ id: s._id, sortOrder: i + 1 })));
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleReplaceMedia = async (sectionId, mediaId, file) => {
    setActionError(null);
    try {
      await replaceShowcaseMedia(sectionId, mediaId, file);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleMoveMedia = async (sectionId, mediaId, direction) => {
    setActionError(null);
    const section = sections.find((s) => s._id === sectionId);
    const mediaList = section?.medias || [];
    const reordered = moveMediaWithinType(mediaList, mediaId, direction);
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
        onMoveMedia={handleMoveMedia}
        onEditSection={handleEditSection}
        onDeleteSection={handleDeleteSection}
        onMoveSectionUp={(sectionId) => handleMoveSection(sectionId, "up")}
        onMoveSectionDown={(sectionId) => handleMoveSection(sectionId, "down")}
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