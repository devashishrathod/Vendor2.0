import { useRef, useState } from "react";
import { Pencil, Trash2, Play, X, ListChecks, Eye, Loader2 } from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal";

// Detects video vs image by file extension in the URL.
const isVideoUrl = (url = "") => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);

const DESCRIPTION_TRUNCATE_LENGTH = 60;

// Table cell: shows a short preview of a long description with a "Read
// more" link that opens the full details modal, instead of the whole
// paragraph stretching the row.
const DescriptionCell = ({ description, onReadMore }) => {
  if (!description) return <span className="text-gray-400">—</span>;
  if (description.length <= DESCRIPTION_TRUNCATE_LENGTH) {
    return <span>{description}</span>;
  }
  return (
    <span>
      {description.slice(0, DESCRIPTION_TRUNCATE_LENGTH).trimEnd()}…{" "}
      <button
        type="button"
        onClick={onReadMore}
        className="font-medium text-emerald-600 hover:underline"
      >
        Read more
      </button>
    </span>
  );
};

const StatusBadge = ({ isActive }) => (
  <span
    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
    }`}
  >
    {isActive ? "Active" : "Inactive"}
  </span>
);

// "View" modal — full details for one listing feature (icon, title, full
// description, status, created date), opened from either the Description
// cell's "Read more" link or the Actions column's eye icon.
const FeatureDetailsModal = ({ feature, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    onClick={onClose}
  >
    <div
      className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">Listing Feature</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <MediaThumb src={feature.iconUrl} alt={feature.lfName} />
          <div>
            <p className="text-sm font-bold text-gray-900">{feature.lfName}</p>
            <StatusBadge isActive={feature.isActive} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 mb-1">Description</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {feature.description || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 mb-1">Created On</p>
          <p className="text-sm text-gray-600">{feature.createdOn}</p>
        </div>
      </div>
    </div>
  </div>
);

const MediaThumb = ({ src, alt, onPlay, onView, onChangeIcon, changing }) => {
  const video = isVideoUrl(src);
  const fileInputRef = useRef(null);

  if (!video) {
    return (
      <div className="group relative h-12 w-12 flex-shrink-0">
        <img
          src={src}
          alt={alt}
          className="h-12 w-12 rounded-xl border border-gray-200 bg-gray-50 object-cover"
        />
        {(onView || onChangeIcon) && (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {onView && (
              <button
                type="button"
                onClick={onView}
                aria-label={`View ${alt}`}
                title="View"
                className="text-white hover:text-emerald-300"
              >
                <Eye size={13} />
              </button>
            )}
            {onChangeIcon && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={changing}
                aria-label={`Change ${alt}`}
                title="Change"
                className="text-white hover:text-emerald-300 disabled:opacity-50"
              >
                {changing ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />}
              </button>
            )}
          </div>
        )}
        {onChangeIcon && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onChangeIcon(file);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onPlay}
      className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-900"
      aria-label={`Play ${alt}`}
    >
      <video src={src} className="h-full w-full object-cover opacity-70" muted />
      <Play
        size={16}
        className="absolute text-white drop-shadow group-hover:scale-110 transition-transform"
        fill="white"
      />
    </button>
  );
};

const VideoModal = ({ src, title, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-lg rounded-2xl bg-black"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute -top-10 right-0 text-white hover:text-gray-300"
      >
        <X size={22} />
      </button>
      <video
        src={src}
        controls
        autoPlay
        className="w-full rounded-2xl"
      >
        Your browser doesn't support video playback.
      </video>
      <p className="mt-2 text-center text-xs text-gray-300">{title}</p>
    </div>
  </div>
);

const ListingFeaturesSection = ({
  listingFeatures,
  onAdd,
  onEdit,
  onDelete,
  onChangeIcon,
}) => {
  const [playingFeature, setPlayingFeature] = useState(null);
  const [viewingFeature, setViewingFeature] = useState(null);
  const [deletingFeature, setDeletingFeature] = useState(null);
  const [changingIconId, setChangingIconId] = useState(null);
  const [iconError, setIconError] = useState("");

  const handleConfirmDelete = () => {
    onDelete(deletingFeature.id);
    setDeletingFeature(null);
  };

  const handleChangeIcon = async (feature, file) => {
    setChangingIconId(feature.id);
    setIconError("");
    try {
      await onChangeIcon(feature, file);
    } catch (err) {
      setIconError(err.message || "Failed to update icon.");
    } finally {
      setChangingIconId(null);
    }
  };

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <ListChecks size={18} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Listing Features
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {listingFeatures.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] px-5 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200"
        >
          Add
        </button>
      </div>

      {iconError && (
        <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-500">
          {iconError}
        </p>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3">S.NO</th>
              <th className="px-5 py-3">Icon</th>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created On</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listingFeatures.features.map((feature) => (
              <tr
                key={feature.id}
                className="border-b border-gray-50 last:border-b-0"
              >
                <td className="px-5 py-4 text-gray-800">{feature.sNo}</td>
                <td className="px-5 py-4">
                  <MediaThumb
                    src={feature.iconUrl}
                    alt={feature.lfName}
                    onPlay={() => setPlayingFeature(feature)}
                    onView={() => setViewingFeature(feature)}
                    onChangeIcon={onChangeIcon ? (file) => handleChangeIcon(feature, file) : undefined}
                    changing={changingIconId === feature.id}
                  />
                </td>
                <td className="px-5 py-4 text-gray-800">{feature.lfName}</td>
                <td className="px-5 py-4 text-gray-800 max-w-xs">
                  <DescriptionCell
                    description={feature.description}
                    onReadMore={() => setViewingFeature(feature)}
                  />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge isActive={feature.isActive} />
                </td>
                <td className="px-5 py-4 text-gray-500">
                  {feature.createdOn}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setViewingFeature(feature)}
                      aria-label="View"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(feature)}
                      aria-label="Edit"
                      className="text-emerald-500 hover:text-emerald-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingFeature(feature)}
                      aria-label="Delete"
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {playingFeature && (
        <VideoModal
          src={playingFeature.iconUrl}
          title={playingFeature.lfName}
          onClose={() => setPlayingFeature(null)}
        />
      )}

      {viewingFeature && (
        <FeatureDetailsModal
          feature={viewingFeature}
          onClose={() => setViewingFeature(null)}
        />
      )}

      {deletingFeature && (
        <ConfirmModal
          title="Delete this listing feature?"
          description={`"${deletingFeature.lfName}" will be permanently removed from your listing. This action can't be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingFeature(null)}
        />
      )}
    </section>
  );
};

export default ListingFeaturesSection;