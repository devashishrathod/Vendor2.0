import { useAddOutletForm } from "../hooks/useAddOutletForm";
import { REGISTRATION_TYPES, MOCK_SUB_BRANDS, MOCK_FRANCHISES } from "../constants/outletConstants";

export default function AddOutletModal({ onClose, onCreated }) {
  const { form, update, submit, submitting, error } = useAddOutletForm((created) => {
    onCreated?.(created);
    onClose();
  });

  const isSubBrand = form.registrationType === REGISTRATION_TYPES.SUB_BRAND;
  const entityOptions = isSubBrand ? MOCK_SUB_BRANDS : MOCK_FRANCHISES;

  const switchType = (type) => {
    update("registrationType", type);
    update("registeredWith", "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-base font-bold text-gray-900">Add Outlet</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Name *</label>
            <input
              type="text"
              value={form.outletName}
              onChange={(e) => update("outletName", e.target.value)}
              placeholder="eg : Andiappan Yoga Academy"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Address *</label>
            <textarea
              rows={3}
              value={form.outletAddress}
              onChange={(e) => update("outletAddress", e.target.value)}
              placeholder="Full outlet address"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 text-gray-700 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet Register With *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => switchType(REGISTRATION_TYPES.SUB_BRAND)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  isSubBrand ? "bg-[#1a1a2e] text-white border-[#1a1a2e]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Sub - Brand
              </button>
              <button
                type="button"
                onClick={() => switchType(REGISTRATION_TYPES.FRANCHISE)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  !isSubBrand ? "bg-[#1a1a2e] text-white border-[#1a1a2e]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Franchise
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isSubBrand ? "Select Sub-Brand *" : "Select Franchise *"}
            </label>
            <div className="relative">
              <select
                value={form.registeredWith}
                onChange={(e) => update("registeredWith", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 appearance-none bg-white text-gray-700"
              >
                <option value="">Select an option</option>
                {entityOptions.map((opt) => (
                  <option key={opt.id} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 bg-[#1a1a2e] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#2d2d5e] disabled:opacity-70"
          >
            {submitting ? "Saving…" : "Save Outlet"}
          </button>
        </div>
      </div>
    </div>
  );
}
