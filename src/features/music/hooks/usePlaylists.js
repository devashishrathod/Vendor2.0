import { useCallback, useEffect, useState } from "react";
import {
  fetchUserPlaylists,
  createPlaylist as createPlaylistApi,
  requestPlaylist as requestPlaylistApi,
} from "../services/musicService";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchUserPlaylists().then((data) => {
      if (!cancelled) {
        setPlaylists(data.playlists);
        setRequests(data.requests);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const createPlaylist = useCallback(async (name) => {
    const playlist = await createPlaylistApi(name);
    setPlaylists((prev) => [...prev, playlist]);
    return playlist;
  }, []);

  const submitRequest = useCallback(async ({ name, note }) => {
    const request = await requestPlaylistApi({ name, note });
    setRequests((prev) => [...prev, request]);
    return request;
  }, []);

  return { playlists, requests, createPlaylist, submitRequest };
}
