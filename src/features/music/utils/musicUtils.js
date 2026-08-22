export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatTime(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Placeholder audio pool — swap for real files/CDN URLs when you have them.
const SRC_POOL = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
];

let songUid = 0;
export function makeSong(title, subtitle) {
  songUid += 1;
  return {
    id: `song-${songUid}`,
    title,
    subtitle,
    src: SRC_POOL[songUid % SRC_POOL.length],
  };
}
