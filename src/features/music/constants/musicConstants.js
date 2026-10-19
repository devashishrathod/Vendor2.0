// Legacy collection names remain exported for older feature modules.
// The active music catalog is defined in constants/musicCatalog.js.
export const MOOD_COLLECTIONS = [];
export const LANGUAGE_COLLECTIONS = [];
export const ARTIST_COLLECTIONS = [];
export const TRENDING_SONGS = [];

// Browse tabs on the Music page. `key` matches a playlist's `category`,
// except "all" and "favourites" which PlaylistBrowser handles itself.
export const MUSIC_BROWSE_TABS = [
  { key: "all", label: "All" },
  { key: "year", label: "Year" },
  { key: "actor", label: "Actors" },
  { key: "singer", label: "Singers" },
  { key: "favourites", label: "Favourites" },
];

export const MUSIC_TAB_TITLES = {
  all: "All playlists",
  year: "By year",
  actor: "Actors",
  singer: "Singers",
  favourites: "Your favourites",
};

// Decade chips under the "Year" tab. Values match a playlist's `era`.
export const MUSIC_ERAS = ["All", "70s", "80s", "90s", "2000s", "2010s", "2020s"];

// Gender toggle under the "Actors" and "Singers" tabs.
export const MUSIC_GENDER_FILTERS = [
  { key: "all", label: "All" },
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
];

// Colour per playlist category: `soft` for small covers, `solid` for the
// big cover on the playlist page, `text` for tags on a light background.
export const PLAYLIST_TONES = {
  year: {
    label: "Year",
    soft: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    solid: "bg-amber-800",
    header: "bg-amber-100 dark:bg-amber-500/10",
    text: "text-amber-800 dark:text-amber-300",
  },
  actor: {
    label: "Actor",
    soft: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
    solid: "bg-violet-800",
    header: "bg-violet-100 dark:bg-violet-500/10",
    text: "text-violet-800 dark:text-violet-300",
  },
  singer: {
    label: "Singer",
    soft: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
    solid: "bg-sky-800",
    header: "bg-sky-100 dark:bg-sky-500/10",
    text: "text-sky-800 dark:text-sky-300",
  },
  language: {
    label: "Language",
    soft: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    solid: "bg-emerald-800",
    header: "bg-emerald-100 dark:bg-emerald-500/10",
    text: "text-emerald-800 dark:text-emerald-300",
  },
};

export const MUSIC_STORAGE_KEY = "trydood-music";
