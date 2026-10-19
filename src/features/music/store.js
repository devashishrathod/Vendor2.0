import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MUSIC_STORAGE_KEY } from "./constants/musicConstants";

const toggleId = (ids, id) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

/**
 * Music preferences — favourite playlists and liked songs.
 * Persisted to localStorage under MUSIC_STORAGE_KEY.
 */
export const useMusicStore = create(
  persist(
    (set) => ({
      favouritePlaylistIds: [],
      likedTrackIds: [],
      toggleFavouritePlaylist: (id) => set((s) => ({ favouritePlaylistIds: toggleId(s.favouritePlaylistIds, id) })),
      toggleLikedTrack: (id) => set((s) => ({ likedTrackIds: toggleId(s.likedTrackIds, id) })),
    }),
    {
      name: MUSIC_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
