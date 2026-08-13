




import { useState, useEffect, useRef } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Heart, Volume2, VolumeX, Play, Pause, Plus, X, ChevronRight } from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const SONGS = [
  {
    id: 1,
    name: "Weekend Special",
    artist: "The Voucher Sessions",
    album: "Happy Hours",
    plays: "12,480",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    name: "Family Combo",
    artist: "Deal Pack",
    album: "Solo Saver",
    plays: "9,210",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    name: "Gold Membership",
    artist: "Loyalty Club",
    album: "Rewards Vol. 1",
    plays: "6,540",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
];

// ─── Neon Wave (matches reference: glowing blue/purple/pink flowing lines) ──
function NeonWave({ isPlaying }) {
  return (
    <div className="relative w-full h-28 rounded-xl bg-[#0a0a14] overflow-hidden">
      <style>{`
        @keyframes waveScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .wave-track {
          width: 200%;
          animation: waveScroll 6s linear infinite;
        }
        .wave-track.paused { animation-play-state: paused; opacity: 0.45; }
        .wave-track.slow { animation-duration: 9s; }
        .wave-track.slower { animation-duration: 13s; }
      `}</style>

      <svg
        className={`wave-track absolute inset-y-0 left-0 h-full slower ${!isPlaying ? "paused" : ""}`}
        viewBox="0 0 600 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60 Q25,20 50,60 T100,60 T150,60 T200,60 T250,60 T300,60 T350,60 T400,60 T450,60 T500,60 T550,60 T600,60
             M600,60 Q625,20 650,60 T700,60 T750,60 T800,60 T850,60 T900,60 T950,60 T1000,60 T1050,60 T1100,60 T1150,60 T1200,60"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="1.5"
          opacity="0.5"
          style={{ filter: "drop-shadow(0 0 6px #7c3aed)" }}
        />
      </svg>

      <svg
        className={`wave-track absolute inset-y-0 left-0 h-full slow ${!isPlaying ? "paused" : ""}`}
        viewBox="0 0 600 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60 C15,25 35,95 55,60 C75,25 95,95 115,60 C135,25 155,95 175,60
             C195,25 215,95 235,60 C255,25 275,95 295,60 C315,25 335,95 355,60
             C375,25 395,95 415,60 C435,25 455,95 475,60 C495,25 515,95 535,60
             C555,25 575,95 595,60
             M600,60 C615,25 635,95 655,60 C675,25 695,95 715,60 C735,25 755,95 775,60
             C795,25 815,95 835,60 C855,25 875,95 895,60 C915,25 935,95 955,60
             C975,25 995,95 1015,60 C1035,25 1055,95 1075,60 C1095,25 1115,95 1135,60
             C1155,25 1175,95 1195,60"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          opacity="0.7"
          style={{ filter: "drop-shadow(0 0 8px #3b82f6)" }}
        />
      </svg>

      <svg
        className={`wave-track absolute inset-y-0 left-0 h-full ${!isPlaying ? "paused" : ""}`}
        viewBox="0 0 600 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60 C10,50 20,10 30,60 C40,110 50,50 60,60 C70,70 80,15 90,60
             C100,105 110,55 120,60 C130,65 140,20 150,60 C160,100 170,55 180,60
             C190,65 200,15 210,60 C220,105 230,50 240,60 C250,70 260,10 270,60
             C280,110 290,55 300,60 C310,65 320,15 330,60 C340,105 350,50 360,60
             C370,70 380,10 390,60 C400,110 410,55 420,60 C430,65 440,15 450,60
             C460,105 470,50 480,60 C490,70 500,10 510,60 C520,110 530,55 540,60
             C550,65 560,15 570,60 C580,105 590,55 600,60
             M600,60 C610,50 620,10 630,60 C640,110 650,50 660,60 C670,70 680,15 690,60
             C700,105 710,55 720,60 C730,65 740,20 750,60 C760,100 770,55 780,60
             C790,65 800,15 810,60 C820,105 830,50 840,60 C850,70 860,10 870,60
             C880,110 890,55 900,60 C910,65 920,15 930,60 C940,105 950,50 960,60
             C970,70 980,10 990,60 C1000,110 1010,55 1020,60 C1030,65 1040,15 1050,60
             C1060,105 1070,50 1080,60 C1090,70 1100,10 1110,60 C1120,110 1130,55 1140,60
             C1150,65 1160,15 1170,60 C1180,105 1190,55 1200,60"
          fill="none"
          stroke="#ec4899"
          strokeWidth="1.5"
          opacity="0.8"
          style={{ filter: "drop-shadow(0 0 6px #ec4899)" }}
        />
      </svg>
    </div>
  );
}

// ─── Progress bar (mm:ss, fills as song plays) ──────────────────────────────
function formatTime(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ProgressBar({ progress, currentTime, duration, onSeek }) {
  return (
    <div className="mt-3">
      <div
        className="h-1.5 bg-gray-100 rounded-full overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = ((e.clientX - rect.left) / rect.width) * 100;
          onSeek(Math.min(100, Math.max(0, pct)));
        }}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-gray-400">{formatTime(currentTime)}</span>
        <span className="text-[11px] text-gray-400">{formatTime(duration)}</span>
      </div>
    </div>
  );
}

// ─── Song Details Popup ─────────────────────────────────────────────────────
function SongDetailsPopup({ song, duration, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
          <Play size={24} className="text-emerald-500" fill="currentColor" />
        </div>

        <h3 className="text-lg font-bold text-gray-900">{song.name}</h3>
        <p className="text-sm text-gray-400 mb-4">{song.artist}</p>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Album</span>
            <span className="text-gray-700 font-medium">{song.album}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Duration</span>
            <span className="text-gray-700 font-medium">{duration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Plays</span>
            <span className="text-gray-700 font-medium">{song.plays}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AnalysisReport() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const activeSong = SONGS[activeIndex];

  // keep <audio> in sync with state, and track real playback progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [activeIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying, activeIndex]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  const toggleFavorite = (id) =>
    setFavorites((f) => ({ ...f, [id]: !f[id] }));

  const addSong = () => {
    setActiveIndex((i) => (i + 1) % SONGS.length);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSeek = (pct) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
      setProgress(pct);
      setCurrentTime(audio.currentTime);
    }
  };


  

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STATS = [
  { label: "Total Revenue",    value: "₹ 84,320.00", change: "+12.4%", positive: true  },
  { label: "Total Orders",     value: "1,248",        change: "+8.2%",  positive: true  },
  { label: "Avg Order Value",  value: "₹ 675.00",    change: "-3.1%",  positive: false },
  { label: "Refunds Issued",   value: "₹ 2,140.00",  change: "-18.5%", positive: false },
];

const TOP_PRODUCTS = [
  { name: "Voucher — Weekend Special",  revenue: "₹ 28,400",  orders: 312, share: 72 },
  { name: "Deal Pack — Family Combo",   revenue: "₹ 19,600",  orders: 210, share: 54 },
  { name: "Membership — Gold",          revenue: "₹ 15,200",  orders: 98,  share: 38 },
  { name: "Voucher — Happy Hours",      revenue: "₹ 11,800",  orders: 187, share: 29 },
  { name: "Deal Pack — Solo Saver",     revenue: "₹ 9,320",   orders: 143, share: 22 },
];

const MONTHLY = [
  { month: "Jan", value: 42 },
  { month: "Feb", value: 58 },
  { month: "Mar", value: 51 },
  { month: "Apr", value: 73 },
  { month: "May", value: 65 },
  { month: "Jun", value: 88 },
  { month: "Jul", value: 79 },
];

const max = Math.max(...MONTHLY.map((m) => m.value));

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
  
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analysis Report</h1>
          <p className="text-xs text-gray-400 mt-1">
            Business performance overview · Updated daily
          </p>
        </div>


        {/* ── Full-length playlist card ── */}
        {/* <div className="bg-white border border-gray-100 rounded-xl p-6 w-full">

          <div className="flex items-center justify-between mb-6">
            <a
              href="/playlist"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors"
            >
              Playlist
              <ChevronRight size={14} />
            </a>

            <button
              onClick={() => setShowPopup(true)}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              {activeSong.name} <span className="text-gray-300">·</span> {activeSong.artist}
            </button>
          </div>


          <div className="mb-6">
            <audio ref={audioRef} src={activeSong.src} preload="metadata" />
            <NeonWave isPlaying={isPlaying} />
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-900">{activeSong.name}</p>
              <p className="text-xs text-gray-400">{activeSong.artist}</p>
            </div>
            <ProgressBar
              progress={progress}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
          </div>

   
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => toggleFavorite(activeSong.id)}
              className={`p-2.5 rounded-full border transition-colors ${
                favorites[activeSong.id]
                  ? "bg-red-50 border-red-100 text-red-500"
                  : "bg-white border-gray-100 text-gray-400 hover:text-red-400"
              }`}
              aria-label="Toggle favorite"
            >
              <Heart size={18} fill={favorites[activeSong.id] ? "currentColor" : "none"} />
            </button>

            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="p-4 rounded-full bg-emerald-400 text-white hover:bg-emerald-500 transition-colors shadow-sm"
              aria-label="Play or pause"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <button
              onClick={() => setIsMuted((m) => !m)}
              className="p-2.5 rounded-full border border-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Toggle mute"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <button
              onClick={addSong}
              className="p-2.5 rounded-full border border-gray-100 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
              aria-label="Add next song"
            >
              <Plus size={18} />
            </button>
          </div>

        </div> */}


        
      <div className="max-w-6xl mx-auto px-6 py-6">

       
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-2">
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full
                ${s.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {s.change} vs last month
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* ── Bar chart ── */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue</p>
            <div className="flex items-end gap-2 h-40">
              {MONTHLY.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{m.value}k</span>
                  <div
                    className="w-full rounded-t-md bg-emerald-400 transition-all duration-300"
                    style={{ height: `${(m.value / max) * 100}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Category split ── */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Revenue by Category</p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Voucher",    pct: 46, color: "bg-emerald-400" },
                { label: "Deal Pack",  pct: 31, color: "bg-purple-400"  },
                { label: "Membership", pct: 23, color: "bg-amber-400"   },
              ].map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{c.label}</span>
                    <span className="font-semibold text-gray-700">{c.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Top products table ── */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Top Performing Products</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Product", "Revenue", "Orders", "Share"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_PRODUCTS.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{row.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">{row.revenue}</td>
                    <td className="px-5 py-3.5 text-gray-500">{row.orders}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${row.share}%` }} />
                        </div>
                        <span className="text-gray-500 w-6 text-right">{row.share}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      </div>

      {showPopup && (
        <SongDetailsPopup song={activeSong} duration={formatTime(duration)} onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
}
