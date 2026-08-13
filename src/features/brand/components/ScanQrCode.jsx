import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const ScanQrCode = ({
  subtitle = "Set working days and timings to ensure customers reach you at the right time.",
  note = "This QR code is securely generated and managed by the Trydood Team.",
  qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://trydood.com",
  onDownload,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">Scan QR Code</h2>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>

      <div className="mt-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-4 px-5 py-6">
          <p className="text-xs font-medium text-gray-800">{note}</p>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              aria-label={showPreview ? "Hide QR code" : "Preview QR code"}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="rounded-md bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Download QR Code
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="flex justify-center border-t border-gray-100 px-5 py-6">
            <img
              src={qrImageUrl}
              alt="QR code"
              className="h-40 w-40 rounded-md border border-gray-100"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default ScanQrCode;