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

  useEffect(() => {
    updatePill(selected);
  }, []); // eslint-disable-line

  useEffect(() => {
    updatePill(selected);
  }, [selected]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1.5 gap-1 w-fit mx-auto"
    >
      {pill.ready && (
        <div
          className="absolute top-1.5 bottom-1.5 rounded-xl shadow-sm pointer-events-none bg-emerald-500"
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
              ${isActive ? "text-white" : "text-gray-400 hover:text-gray-600"}`}
          >
            <PieIcon fill={plan.iconFill} size={22} />
            {plan.label}
          </button>
        );
      })}
    </div>
  );
}