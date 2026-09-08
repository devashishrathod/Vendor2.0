import { useState } from "react";

import ListingFeaturesSection from "../components/ListingFeaturesSection";
import AddListingFeatureModal from "../components/AddListingFeatureModal";
import useListingFeatures from "../hooks/useListingFeatures";
import {
  addListingFeature,
  updateListingFeature,
  deleteListingFeature,
} from "../services/brandApi";

const ListingFeaturesPage = ({ brandId }) => {
  const { data: features, loading, error, reload } = useListingFeatures(brandId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);

  const handleAdd = () => setShowAddModal(true);

  const handleAddSubmit = async ({ title, description, isActive, iconFile }) => {
    await addListingFeature(brandId, { title, description, isActive, iconFile });
    reload();
  };

  const handleEdit = (feature) => setEditingFeature(feature);

  const handleEditSubmit = async ({ title, description, isActive, iconFile }) => {
    await updateListingFeature(editingFeature.id, { title, description, isActive, iconFile });
    reload();
  };

  const handleDelete = async (id) => {
    try {
      await deleteListingFeature(id);
      reload();
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  };

  // "Change" on the Icon column's hover overlay — swaps just the icon,
  // keeping the feature's title/description/status untouched.
  const handleChangeIcon = async (feature, iconFile) => {
    await updateListingFeature(feature.id, { iconFile });
    reload();
  };

  if (loading) {
    return <p className="text-sm text-gray-400">Loading listing features…</p>;
  }

  const listingFeatures = {
    subtitle: "Manage the features and amenities shown on your listing.",
    features: features.map((f, idx) => ({
      id: f._id,
      sNo: idx + 1,
      iconUrl: f.icon,
      lfName: f.title,
      description: f.description,
      isActive: f.isActive,
      createdOn: f.createdAt
        ? new Date(f.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
    })),
  };

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-500">
          Couldn't load live data ({error}). Showing cached details.
        </p>
      )}
      <ListingFeaturesSection
        listingFeatures={listingFeatures}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onChangeIcon={handleChangeIcon}
      />

      {showAddModal && (
        <AddListingFeatureModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {editingFeature && (
        <AddListingFeatureModal
          mode="edit"
          feature={editingFeature}
          onClose={() => setEditingFeature(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default ListingFeaturesPage;