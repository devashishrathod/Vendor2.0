import React, { useState } from "react";

import ListingFeaturesSection from "../components/ListingFeaturesSection";
import AddListingFeatureModal from "../components/AddListingFeatureModal";
import useListingFeatures from "../hooks/useListingFeatures";
import {
  addListingFeature,
  refreshListingFeature,
  deleteListingFeature,
} from "../services/brandApi";

const ListingFeaturesPage = ({ brandId }) => {
  const { data: features, loading, error, reload } = useListingFeatures(brandId);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = () => setShowAddModal(true);

  const handleAddSubmit = async ({ title, description, isActive, iconFile }) => {
    await addListingFeature(brandId, { title, description, isActive, iconFile });
    reload();
  };

  const handleRefresh = async (id) => {
    try {
      await refreshListingFeature(id);
      reload();
    } catch (err) {
      console.error("Refresh failed:", err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteListingFeature(id);
      reload();
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
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
        <p className="mb-4 text-sm text-red-500">
          Couldn't load live data ({error}). Showing cached details.
        </p>
      )}
      <ListingFeaturesSection
        listingFeatures={listingFeatures}
        onAdd={handleAdd}
        onRefresh={handleRefresh}
        onDelete={handleDelete}
      />

      {showAddModal && (
        <AddListingFeatureModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddSubmit}
        />
      )}
    </div>
  );
};

export default ListingFeaturesPage;