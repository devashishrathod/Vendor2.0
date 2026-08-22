import React from "react";
import ShowcaseGroup from "./ShowcaseGroup";

const ShowcaseSection = ({ showcase, onAddMore }) => {
  return (
    <section>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Showcase
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{showcase.subtitle}</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {showcase.groups.map((group) => (
          <ShowcaseGroup
            key={group.id}
            group={group}
            guidelinesLink={showcase.guidelinesLink}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddMore}
        className="mt-6 w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] py-3 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition-all duration-200"
      >
        Add More Showcase
      </button>
    </section>
  );
};

export default ShowcaseSection;