import React, { useState } from "react";

import ShowcaseSection from "../components/ShowcaseSection";
import AddShowcaseSectionModal from "../components/AddShowcaseSectionModal";
import useBrandShowcase from "../hooks/useBrandShowcase";
import {
  createShowcaseSectionWithMedia,
  addShowcaseMedia,
  deleteShowcaseMedia,
  deleteShowcaseSection,
} from "../services/brandApi";

/**
 * ShowcasePage
 * "Showcase Details" tab — live sections + media from
 * GET /showcase/get-brand-showcase/:brandId, with add-section,
 * add-media, delete-media, delete-section wired to the real API.
 */
const ShowcasePage = ({ brandId }) => {
  const { data, loading, error, reload } = useBrandShowcase(brandId);
  const [showAddModal, setShowAddModal] = useState(false);
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

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-500">
          Couldn't load live data ({error}). Showing cached details.
        </p>
      )}
      {actionError && (
        <p className="mb-4 text-sm text-red-500">{actionError}</p>
      )}

      <ShowcaseSection
        showcase={showcase}
        onAddMore={handleAddMore}
        onAddMedia={handleAddMedia}
        onDeleteMedia={handleDeleteMedia}
        onDeleteSection={handleDeleteSection}
      />

      {showAddModal && (
        <AddShowcaseSectionModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateSection}
        />
      )}
    </div>
  );
};

export default ShowcasePage;