import React from "react";

const BrandHeader = ({ brandName, merchantId }) => {
  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 capitalize">{brandName}</h1>
      <p className="mt-1 text-xs text-gray-500">
        Merchant ID : {merchantId || "—"}
      </p>
    </div>
  );
};

export default BrandHeader;