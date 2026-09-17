import { useEffect, useState } from "react";
import { fetchCollections } from "../services/musicService";

export function useCollections() {
  const [collections, setCollections] = useState({ mood: [], language: [], artist: [], trending: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCollections().then((data) => {
      if (!cancelled) {
        setCollections(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...collections, loading };
}
