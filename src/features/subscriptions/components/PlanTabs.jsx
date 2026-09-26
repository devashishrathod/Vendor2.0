// import { useRef, useEffect, useState } from "react";
// import { PLANS } from "@/utils/Plandata";
// import { PieIcon } from "./PlanIcons";

// export default function PlanTabs({ selected, onChange }) {
//   const containerRef = useRef(null);
//   const btnRefs = useRef({});
//   const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

//   const updatePill = (id) => {
//     const btn = btnRefs.current[id];
//     const container = containerRef.current;
//     if (!btn || !container) return;
//     const cRect = container.getBoundingClientRect();
//     const bRect = btn.getBoundingClientRect();
//     setPill({ left: bRect.left - cRect.left, width: bRect.width, ready: true });
//   };

//   useEffect(() => {
//     updatePill(selected);
//   }, []); // eslint-disable-line

//   useEffect(() => {
//     updatePill(selected);
//   }, [selected]);

//   return (
//     <div
//       ref={containerRef}
//       className="relative flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1.5 gap-1 w-fit mx-auto"
//     >
//       {pill.ready && (
//         <div
//           className="absolute top-1.5 bottom-1.5 rounded-xl shadow-sm pointer-events-none bg-white"
//           style={{
//             width: pill.width,
//             transform: `translateX(${pill.left}px)`,
//             left: 0,
//             transition:
//               "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
//           }}
//         />
//       )}

//       {PLANS.map((plan) => {
//         const isActive = selected === plan.id;
//         return (
//           <button
//             key={plan.id}
//             ref={(el) => (btnRefs.current[plan.id] = el)}
//             onClick={() => onChange(plan.id)}
//             className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold select-none
//               transition-colors duration-200
//               ${isActive ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
//           >
//            <PieIcon fill={plan.iconFill} active={isActive} size={22} />
//             {plan.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }


import { useRef, useEffect, useState } from "react";
import { PieIcon } from "./PlanIcons";

export default function PlanTabs({ plans = [], selected, onChange, loading = false }) {
  const containerRef = useRef(null);
  const btnRefs = useRef({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  const updatePill = (id) => {
    const btn = btnRefs.current[id];
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
  }, [selected, plans]);

  if (loading) {
    return (
      <div className="flex items-center gap-1 w-fit mx-auto bg-gray-50 dark:bg-gray-700 rounded-2xl p-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 w-28 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!plans.length) {
    return (
      <p className="text-center text-sm text-gray-400">No subscription plans available right now.</p>
    );
  }

  return (
    <div
      ref={containerRef}
      // ⚠️ FIXED: `bg-gray-50` (#F9FAFB) was almost the exact same color as
      // this page's own background (`#F8FAF7`, set in SubscriptionPlan.jsx)
      // — a ~1-unit-per-channel difference, invisible in light mode. Only
      // dark mode had real contrast (`bg-gray-700` against `bg-gray-900`).
      // `bg-gray-200` gives light mode a visibly distinct track again
      // without matching the active pill's own `bg-white` below.
      className="relative flex items-center bg-gray-200 dark:bg-gray-700 rounded-2xl p-1.5 gap-1 w-fit mx-auto"
    >
      {pill.ready && (
        <div
          className="absolute top-1.5 bottom-1.5 rounded-xl shadow-sm pointer-events-none bg-white dark:bg-gray-800"
          style={{
            width: pill.width,
            transform: `translateX(${pill.left}px)`,
            left: 0,
            transition:
              "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      )}

      {plans.map((plan, i) => {
        const isActive = selected === plan.id;
        // API doesn't send an icon fill — spread evenly across the set instead.
        const iconFill = (i + 1) / plans.length;
        return (
          <button
            key={plan.id}
            ref={(el) => (btnRefs.current[plan.id] = el)}
            onClick={() => onChange(plan.id)}
            className={`group relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold select-none
              transition-colors duration-200
              ${isActive ? "text-black dark:text-gray-100" : "text-gray-400 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"}`}
          >
            <PieIcon fill={iconFill} active={isActive} size={22} />
            {plan.label}
          </button>
        );
      })}
    </div>
  );
}