import { useRef, useEffect, useState } from "react";
import { PLANS } from "@/utils/Plandata";
import { PieIcon } from "./PlanIcons";

export default function PlanTabs({ selected, onChange }) {
  const containerRef = useRef(null);
  const btnRefs      = useRef({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  const updatePill = (id) => {
    const btn       = btnRefs.current[id];
    const container = containerRef.current;
    if (!btn || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setPill({ left: bRect.left - cRect.left, width: bRect.width, ready: true });
  };

  // Set pill on mount (no animation on first render)
  useEffect(() => {
    updatePill(selected);
  }, []); // eslint-disable-line

  // Update pill on tab change — this triggers the CSS transition
  useEffect(() => {
    updatePill(selected);
  }, [selected]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1.5 gap-1 w-fit mx-auto"
    >
      {/* Sliding pill — translates from current x to next x */}
      {pill.ready && (
        <div
          className="absolute top-1.5 bottom-1.5 bg-white border border-gray-200 rounded-xl shadow-sm pointer-events-none"
          style={{
            width: pill.width,
            transform: `translateX(${pill.left}px)`,
            left: 0,
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      )}

      {PLANS.map((plan) => {
        const isActive = selected === plan.id;
        return (
          <button
            key={plan.id}
            ref={(el) => (btnRefs.current[plan.id] = el)}
            onClick={() => onChange(plan.id)}
            className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold select-none
              transition-colors duration-200
              ${isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
          >
            <PieIcon fill={plan.iconFill} size={22} />
            {plan.label}
          </button>
        );
      })}
    </div>
  );
}