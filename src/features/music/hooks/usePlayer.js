import { useEffect, useRef, useState } from "react";

export function usePlayer() {
  const [queue, setQueue] = useState([]);
  const [queueName, setQueueName] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(1);
  const [favorites, setFavorites] = useState({});
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const activeSong = queue[activeIndex] || null;

  // Keep the <audio> element's events in sync with playback state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
        return;
      }
      if (isShuffle && queue.length > 1) {
        let nextIndex = activeIndex;
        while (nextIndex === activeIndex) nextIndex = Math.floor(Math.random() * queue.length);
        playAt(nextIndex);
        return;
      }
      playAt(activeIndex + 1);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, queue, isRepeat, isShuffle]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying, activeIndex, activeSong]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function playCollection(collection) {
    setQueue(collection.songs);
    setQueueName(collection.name);
    setActiveIndex(0);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function playSongInCollection(collection, index) {
    const sameQueue = queueName === collection.name;
    if (sameQueue && activeIndex === index) {
      setIsPlaying((p) => !p);
      return;
    }
    setQueue(collection.songs);
    setQueueName(collection.name);
    setActiveIndex(index);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function playAt(index) {
    if (!queue.length) return;
    const nextIndex = ((index % queue.length) + queue.length) % queue.length;
    setActiveIndex(nextIndex);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function togglePlayPause() {
    setIsPlaying((p) => !p);
  }

  function toggleFavorite(id) {
    setFavorites((f) => ({ ...f, [id]: !f[id] }));
  }

  function toggleMute() {
    setIsMuted((m) => !m);
  }

  function toggleShuffle() {
    setIsShuffle((s) => !s);
  }

  function toggleRepeat() {
    setIsRepeat((r) => !r);
  }

  function setVolumeLevel(level) {
    const clamped = Math.min(1, Math.max(0, level));
    setVolume(clamped);
    if (clamped > 0) setIsMuted(false);
  }

  function handleSeek(pct) {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
      setProgress(pct);
      setCurrentTime(audio.currentTime);
    }
  }

  return {
    audioRef,
    queue,
    queueName,
    activeIndex,
    activeSong,
    isPlaying,
    isMuted,
    isShuffle,
    isRepeat,
    volume,
    favorites,
    progress,
    currentTime,
    duration,
    playCollection,
    playSongInCollection,
    playAt,
    togglePlayPause,
    toggleFavorite,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setVolumeLevel,
    handleSeek,
  };
}
