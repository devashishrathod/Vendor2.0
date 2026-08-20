import React from "react";
import { Store } from "lucide-react";

const BrandHeader = ({ brandName, merchantId }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
        <Store size={20} className="text-emerald-500" strokeWidth={1.8} />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900 capitalize leading-tight">{brandName}</h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Merchant ID : {merchantId || "—"}
        </p>
      </div>
    </div>
  );
};

export default BrandHeader;