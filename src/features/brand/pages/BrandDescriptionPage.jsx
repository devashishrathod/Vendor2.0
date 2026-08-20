import React, { useState } from "react";

import BrandDescription from "../components/BrandDescription";
import { updateBrandDetails } from "../services/brandApi";

const formatLastUpdate = (isoDate) => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const BrandDescriptionPage = ({ brand, brandId, brandLoading, brandError }) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  if (brandLoading) {
    return <p className="text-sm text-gray-400">Loading description…</p>;
  }

  if (!brand) {
    return <p className="text-sm text-gray-500">No brand data found.</p>;
  }

  const handleUpdate = async (newDescription) => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateBrandDetails(brandId, { description: newDescription });
    } catch (err) {
      setSaveError(err.message || "Failed to update description.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {brandError && (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-500">
          Couldn't load live data ({brandError}). Showing cached details.
        </p>
      )}
      {saveError && (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-500">{saveError}</p>
      )}

      <BrandDescription
        description={brand.description}
        lastUpdate={formatLastUpdate(brand.updatedAt)}
        onUpdate={handleUpdate}
      />

      {saving && (
        <p className="mt-2 text-sm text-gray-400">Saving…</p>
      )}
    </div>
  );
};

export default BrandDescriptionPage;