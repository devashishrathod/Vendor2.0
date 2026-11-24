import { useEffect, useState } from "react";

// How often the numbers move (only while the tab is visible).
const TICK_MS = 3000;

// Per tick: the chance a metric moves and the range it moves by. The top of
// the funnel grows most; contact actions only now and then.
const GROWTH = Object.freeze({
  impressions: { chance: 1, min: 20, max: 120 },
  reached: { chance: 1, min: 10, max: 80 },
  views: { chance: 0.9, min: 3, max: 25 },
  conversions: { chance: 0.3, min: 1, max: 1 },
  directions: { chance: 0.2, min: 1, max: 1 },
  whatsapp: { chance: 0.15, min: 1, max: 1 },
});

// A metric never passes the one it comes from (reached ≤ impressions …).
const CAPPED_BY = Object.freeze({ reached: "impressions", views: "reached", conversions: "views" });

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/**
 * Simulated live growth for the dummy reach numbers — there is no reach /
 * engagement API yet. Starts from `initial` and grows a little every few
 * seconds; `deltas` is what each metric gained on the latest tick and `tick`
 * changes every tick (to replay the "+N" hint). Drop this hook once real
 * counts come from the server.
 * @param {Record<string, number>} initial
 * @returns {{ values: Record<string, number>, deltas: Record<string, number>, tick: number }}
 */
export default function useLiveReachMetrics(initial) {
  const [state, setState] = useState(() => ({ values: { ...initial }, deltas: {}, tick: 0 }));

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setState((prev) => {
        const values = { ...prev.values };
        const deltas = {};
        for (const [key, rule] of Object.entries(GROWTH)) {
          if (!(key in values) || Math.random() > rule.chance) continue;
          let next = values[key] + randomInt(rule.min, rule.max);
          const cap = CAPPED_BY[key];
          if (cap) next = Math.min(next, values[cap]);
          if (next > values[key]) {
            deltas[key] = next - values[key];
            values[key] = next;
          }
        }
        return { values, deltas, tick: prev.tick + 1 };
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return state;
}
