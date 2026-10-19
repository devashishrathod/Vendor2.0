import { useEffect, useState } from "react";
import { fetchPlaylistCatalog } from "../services/musicService";

/**
 * Loads Trydood's playlist catalog.
 * @returns {{ playlists: import("../constants/musicCatalog").CatalogPlaylist[], loading: boolean, error: string }}
 */
export function usePlaylistCatalog() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPlaylistCatalog();
        if (!cancelled) setPlaylists(data);
      } catch (err) {
        console.error("Playlist catalog fetch failed:", err);
        if (!cancelled) setError("Couldn't load playlists. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { playlists, loading, error };
}
