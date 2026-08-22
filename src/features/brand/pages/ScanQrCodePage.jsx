import React from "react";
import ScanQrCode from "../components/ScanQrCode";

const ScanQrCodePage = () => {
    const handlePreview = () => {
        console.log("Preview QR code clicked");
    };

    const handleDownload = () => {
        // Wire this up to services/brandApi.js -> a downloadQrCode() call
        console.log("Download QR code clicked");
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <ScanQrCode onPreview={handlePreview} onDownload={handleDownload} />
        </div>
    );
};

export default ScanQrCodePage;