import React, { useState } from "react";
import { Eye, EyeOff, QrCode } from "lucide-react";

const ScanQrCode = ({
  subtitle = "Set working days and timings to ensure customers reach you at the right time.",
  note = "This QR code is securely generated and managed by the Trydood Team.",
  qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://trydood.com",
  onDownload,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <section>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <QrCode size={18} className="text-emerald-500 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Scan QR Code</h2>
          <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between gap-4 px-5 py-6">
          <p className="text-xs font-medium text-gray-800 dark:text-gray-100">{note}</p>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              aria-label={showPreview ? "Hide QR code" : "Preview QR code"}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200 hover:bg-emerald-600 active:scale-[0.97]"
            >
              Download QR Code
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="flex justify-center px-5 py-6">
            <img
              src={qrImageUrl}
              alt="QR code"
              className="h-40 w-40 rounded-xl"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default ScanQrCode;