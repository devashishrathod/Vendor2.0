import React from "react";

const ShowcaseMediaRow = ({ images, type }) => {
  const safeImages = Array.isArray(images) ? images : [];

  if (safeImages.length === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-5 py-4">
      {safeImages.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`${type} preview ${idx + 1}`}
          className="h-14 w-14 rounded-md object-cover"
        />
      ))}
    </div>
  );
};

export default ShowcaseMediaRow;