export default function MiniWave({ isPlaying }) {
  return (
    <div className="relative w-14 h-9 rounded-md bg-[#0a0a14] overflow-hidden flex-shrink-0">
      <style>{`
        @keyframes miniWaveScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .mini-wave { width: 200%; animation: miniWaveScroll 4s linear infinite; }
        .mini-wave.paused { animation-play-state: paused; opacity: 0.4; }
      `}</style>
      <svg
        className={`mini-wave absolute inset-y-0 left-0 h-full ${!isPlaying ? "paused" : ""}`}
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
      >
        <path
          d="M0,20 C5,8 10,32 15,20 C20,8 25,32 30,20 C35,8 40,32 45,20 C50,8 55,32 60,20
             C65,8 70,32 75,20 C80,8 85,32 90,20 C95,8 100,32 105,20
             M100,20 C105,8 110,32 115,20 C120,8 125,32 130,20 C135,8 140,32 145,20
             C150,8 155,32 160,20 C165,8 170,32 175,20 C180,8 185,32 190,20 C195,8 200,32 205,20"
          fill="none"
          stroke="#ec4899"
          strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 4px #ec4899)" }}
        />
      </svg>
    </div>
  );
}
