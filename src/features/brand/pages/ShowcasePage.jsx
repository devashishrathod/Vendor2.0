import React from "react";

import ShowcaseSection from "../components/ShowcaseSection";

/**
 * ShowcasePage
 * "Showcase Details" tab — Ambience / Gallery / Menu / Event
 * just displays preview images & videos for each group.
 */
const IMAGE_PREVIEWS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=100&h=100&fit=crop",
];

const VIDEO_PREVIEWS = [
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=100&h=100&fit=crop",
];

const showcase = {
  subtitle: "View and update your profile, settings, and account information.",
  guidelinesLink: "#",
  groups: [
    {
      id: "ambience",
      title: "Ambience Images & Video",
      subtitle:
        "Ensure images follow our event card guidelines and are provided in both formats.",
      images: IMAGE_PREVIEWS,
      videos: VIDEO_PREVIEWS,
    },
    {
      id: "gallery",
      title: "Gallery Images & Video",
      subtitle:
        "Ensure images follow our event card guidelines and are provided in both formats.",
      images: IMAGE_PREVIEWS,
      videos: VIDEO_PREVIEWS,
    },
  ],
};

const ShowcasePage = () => {
  const handleAddMore = () => {
    console.log("Add More Showcase clicked");
  };

  return <ShowcaseSection showcase={showcase} onAddMore={handleAddMore} />;
};

export default ShowcasePage;