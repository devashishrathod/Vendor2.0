// src/features/oulet/New folder/components/brandOutlet/modals/VideoUploadModal.jsx
// Confirmed from the add-media error response: "A video needs a poster
// image. Attach one as 'thumbnail', or name its upload as
// 'thumbnailUploadIds'." — every video upload needs a poster, not just
// ones marked "Show in Video Clips". This modal collects that poster (and
// the optional clips flag) before the video is ever sent to the API,
// instead of letting the request fail and showing a red "Upload failed"
// tile for what was actually a missing-poster rejection.
import { useState } from "react";
import { Upload, X } from "lucide-react";

export default function VideoUploadModal({ videoPreviewUrl, onCancel, onConfirm, submitting }) {
  const [poster, setPoster] = useState(null);
  const [isShowInVideoClips, setIsShowInVideoClips] = useState(false);

  const posterPreviewUrl = poster ? URL.createObjectURL(poster) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={submitting ? undefined : onCancel}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Add Video</h3>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="mb-3 text-xs text-gray-400">A poster image is required for every video.</p>

          <video
            src={videoPreviewUrl}
            muted
            playsInline
            preload="metadata"
            className="mb-3 h-40 w-full rounded-xl bg-black object-cover"
          />

          <label className="mb-1.5 block text-xs font-medium text-gray-500">Poster (required)</label>
          <div className="flex items-center gap-3">
            {poster && <img src={posterPreviewUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-gray-50 text-gray-400 hover:bg-emerald-50/40 hover:text-emerald-500 dark:bg-gray-700/40 dark:hover:bg-emerald-500/10">
              <Upload className="h-4 w-4" />
              <span className="text-[10px]">{poster ? "Change" : "Add"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPoster(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isShowInVideoClips}
              onChange={(e) => setIsShowInVideoClips(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-emerald-600"
            />
            Show in Video Clips
          </label>
        </div>

        <div className="flex gap-2 px-6 py-4">
          <button
            type="button"
            onClick={() => onConfirm({ poster, isShowInVideoClips })}
            disabled={!poster || submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300 dark:disabled:bg-gray-700"
          >
            {submitting ? "Uploading…" : "Upload Video"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
