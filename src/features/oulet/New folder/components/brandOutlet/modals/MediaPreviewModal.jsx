export default function MediaPreviewModal({ src, type, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-sm font-semibold flex items-center gap-1 hover:opacity-80"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>
        {type === "video" ? (
          <video src={src} controls autoPlay className="w-full rounded-xl max-h-[75vh] object-contain bg-black" />
        ) : (
          <img src={src} alt="Preview" className="w-full rounded-xl max-h-[75vh] object-contain bg-black" />
        )}
      </div>
    </div>
  );
}
