import { useRef, useState } from "react";
import { Pencil, Trash2, Play, X, ListChecks, Eye, Loader2, Plus } from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal";

// Detects video vs image by file extension in the URL.
const isVideoUrl = (url = "") => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);

const StatusBadge = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
    {isActive ? "Active" : "Inactive"}
  </span>
);

// Small icon button used in each feature tile's action row.
const TileAction = ({ onClick, label, className, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label.split(" ")[0]}
    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${className}`}
  >
    {children}
  </button>
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
      className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Listing Feature</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <MediaThumb src={feature.iconUrl} alt={feature.lfName} />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{feature.lfName}</p>
            <StatusBadge isActive={feature.isActive} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Description</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {feature.description || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Created On</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{feature.createdOn}</p>
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
          className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-gray-700 object-cover"
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
      className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gray-900"
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

  const totalCount = listingFeatures.features.length;
  const activeCount = listingFeatures.features.filter((f) => f.isActive).length;

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
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <ListChecks size={18} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Listing Features
              </h2>
              {totalCount > 0 && (
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-300">
                  {activeCount}/{totalCount} active
                </span>
              )}
            </div>
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
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500">
          {iconError}
        </p>
      )}

      {totalCount === 0 && (
        <p className="mt-6 text-xs text-gray-400">
          No listing features yet — add one to show customers what your business offers.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listingFeatures.features.map((feature) => (
          <article
            key={feature.id}
            className={`group flex flex-col rounded-2xl border bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50 dark:bg-gray-900/40 dark:hover:border-emerald-500/40 dark:hover:shadow-none ${
              feature.isActive ? "border-gray-100 dark:border-gray-700" : "border-dashed border-gray-200 opacity-75 dark:border-gray-700"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="rounded-2xl bg-emerald-50/70 p-1.5 dark:bg-emerald-500/10">
                <MediaThumb
                  src={feature.iconUrl}
                  alt={feature.lfName}
                  onPlay={() => setPlayingFeature(feature)}
                  onView={() => setViewingFeature(feature)}
                  onChangeIcon={onChangeIcon ? (file) => handleChangeIcon(feature, file) : undefined}
                  changing={changingIconId === feature.id}
                />
              </div>
              <div className="flex items-center gap-0.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <TileAction
                  onClick={() => setViewingFeature(feature)}
                  label={`View ${feature.lfName}`}
                  className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                >
                  <Eye size={15} />
                </TileAction>
                <TileAction
                  onClick={() => onEdit(feature)}
                  label={`Edit ${feature.lfName}`}
                  className="text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                >
                  <Pencil size={15} />
                </TileAction>
                <TileAction
                  onClick={() => setDeletingFeature(feature)}
                  label={`Delete ${feature.lfName}`}
                  className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={15} />
                </TileAction>
              </div>
            </div>

            <h3 className="mt-3 truncate text-sm font-bold text-gray-900 dark:text-gray-100">
              {feature.lfName}
            </h3>
            <p className="mt-1 line-clamp-2 min-h-8 flex-1 text-xs leading-4 text-gray-500 dark:text-gray-400">
              {feature.description || "No description added."}
            </p>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-dashed border-gray-100 pt-3 dark:border-gray-700">
              <StatusBadge isActive={feature.isActive} />
              <span className="truncate text-[11px] text-gray-400">{feature.createdOn}</span>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="group flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-600 dark:border-gray-700 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-emerald-100 dark:bg-gray-700 dark:group-hover:bg-emerald-500/20">
            <Plus size={18} />
          </span>
          <span className="text-sm font-semibold">Add feature</span>
        </button>
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