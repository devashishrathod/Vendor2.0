import { MOOD_COLLECTIONS, LANGUAGE_COLLECTIONS, ARTIST_COLLECTIONS, TRENDING_SONGS } from "../constants/musicConstants";

// Point these at your real backend when ready, e.g.
// const API_BASE = "/api/music";
// and replace the bodies below with fetch()/axios calls.

let USER_PLAYLISTS = [];
let PLAYLIST_REQUESTS = [];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchCollections() {
  await delay(200);
  return { mood: MOOD_COLLECTIONS, language: LANGUAGE_COLLECTIONS, artist: ARTIST_COLLECTIONS, trending: TRENDING_SONGS };
}

export async function fetchUserPlaylists() {
  await delay(150);
  return { playlists: USER_PLAYLISTS, requests: PLAYLIST_REQUESTS };
}

export async function createPlaylist(name) {
  await delay(250);
  const playlist = { id: `pl-${Date.now()}`, name, songs: [] };
  USER_PLAYLISTS = [...USER_PLAYLISTS, playlist];
  return playlist;
}

export async function requestPlaylist({ name, note }) {
  await delay(250);
  const request = { id: `req-${Date.now()}`, name, note, status: "pending" };
  PLAYLIST_REQUESTS = [...PLAYLIST_REQUESTS, request];
  return request;
}
