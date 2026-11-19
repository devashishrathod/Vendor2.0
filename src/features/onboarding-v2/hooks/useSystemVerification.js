import { useCallback, useEffect, useRef, useState } from "react";
import { SCREENS } from "../config/onboardingFlow";
import { runSystemVerification } from "../services/onboardingApi";
import { useOnboardingV2Store } from "../store/onboardingStore";
import {
  buildChecks,
  clearCachedResult,
  getOutcome,
  readCachedResult,
  sleep,
  summarizeResult,
  writeCachedResult,
} from "../utils/systemVerification";

// Keeps the first spinner up long enough to read, even on a fast API.
const MIN_LOADING_MS = 600;
// Time each check spins before its result is shown.
const REVEAL_STEP_MS = 450;

const EMPTY_SUMMARY = { score: null, remarks: [] };

/**
 * @typedef {"loading"|"revealing"|"approved"|"review"|"failed"|"error"} VerificationPhase
 */

/**
 * Runs the backend system verification once, then reveals the checks one by
 * one. A result cached in this tab is shown straight away instead.
 * @returns {{
 *   phase: VerificationPhase,
 *   isRunning: boolean,
 *   checks: import("../utils/systemVerification").VerificationCheck[],
 *   revealed: number,
 *   summary: import("../utils/systemVerification").VerificationSummary,
 *   error: string,
 *   retry: () => void,
 * }}
 */
export function useSystemVerification() {
  const branch = useOnboardingV2Store((s) => s.branch);
  // Only an explicit skip — an empty local store (new device, after logout)
  // doesn't mean the backend has no bank.
  const bankSkipped = useOnboardingV2Store((s) => s.skipped.includes(SCREENS.BANK_ENTER));

  const [phase, setPhase] = useState("loading");
  const [checks, setChecks] = useState([]);
  // Index of the check currently spinning; checks before it show results.
  const [revealed, setRevealed] = useState(-1);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  const run = useCallback(
    async ({ fresh = false } = {}) => {
      const options = { branch, bankSkipped };
      setError("");

      const cached = fresh ? null : readCachedResult();
      if (cached) {
        const built = buildChecks(cached.flags, cached.remarks, options);
        setChecks(built);
        setSummary(summarizeResult(cached));
        setRevealed(built.length);
        setPhase(getOutcome(cached.status, built));
        return;
      }

      // Show the tiles right away so the vendor sees what's being checked.
      setPhase("loading");
      setSummary(EMPTY_SUMMARY);
      setChecks(buildChecks({}, [], options));
      setRevealed(0);
      try {
        const [data] = await Promise.all([runSystemVerification(), sleep(MIN_LOADING_MS)]);
        const result = data?.data ?? data ?? {};
        writeCachedResult(result);
        const built = buildChecks(result.flags, result.remarks, options);
        setChecks(built);
        setPhase("revealing");
        for (let i = 0; i < built.length; i += 1) {
          setRevealed(i);
          await sleep(REVEAL_STEP_MS);
        }
        setRevealed(built.length);
        setSummary(summarizeResult(result));
        setPhase(getOutcome(result.status, built));
      } catch (err) {
        console.error("System verification failed:", err);
        setError(err?.message || "We couldn't run verification right now.");
        // No result — drop the placeholder tiles so none keeps spinning.
        setChecks([]);
        setRevealed(-1);
        setPhase("error");
      }
    },
    [bankSkipped, branch],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, [run]);

  const retry = useCallback(() => {
    clearCachedResult();
    run({ fresh: true });
  }, [run]);

  return {
    phase,
    isRunning: phase === "loading" || phase === "revealing",
    checks,
    revealed,
    summary,
    error,
    retry,
  };
}
