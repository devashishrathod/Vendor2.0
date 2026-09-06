import { useEffect, useState } from "react";

/**
 * Reads each song's real duration straight from its audio file (via a
 * throwaway <audio> element's loadedmetadata event) instead of showing a
 * made-up time — returns { [songId]: seconds }, filled in as each one
 * resolves.
 */
export function useSongDurations(songs) {
  const [durations, setDurations] = useState({});

  useEffect(() => {
    let cancelled = false;
    const entries = songs.map((song) => {
      const audio = new Audio();
      audio.preload = "metadata";
      const handleLoaded = () => {
        if (!cancelled) setDurations((d) => ({ ...d, [song.id]: audio.duration }));
      };
      audio.addEventListener("loadedmetadata", handleLoaded);
      audio.src = song.src;
      return { audio, handleLoaded };
    });

    return () => {
      cancelled = true;
      entries.forEach(({ audio, handleLoaded }) => audio.removeEventListener("loadedmetadata", handleLoaded));
    };
  }, [songs]);

  return durations;
}
