import { useEffect } from "react";

export function useBlockBack(shouldBlock = true) {
  useEffect(() => {
    if (!shouldBlock) return;

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [shouldBlock]);
}