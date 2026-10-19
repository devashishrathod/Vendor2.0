import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Music2 } from "lucide-react";
import AppBackground from "@/components/common/AppBackground";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import DashboardFooter from "@/features/dashboard/components/DashboardFooter";
import MusicQuickPlayModal from "@/features/music/components/MusicQuickPlayModal";
import BottomPlayer from "@/features/music/components/BottomPlayer";
import { usePlayer } from "@/features/music/hooks/usePlayer";

export default function DashboardLayout() {
    const [activeTab, setActiveTab] = useState("Analysis Report");
    const [musicModalOpen, setMusicModalOpen] = useState(false);
    const player = usePlayer();
    return (
        // `isolate` keeps AppBackground's -z-10 glows above this gradient
        // but behind every page.
        <div className="app-shell-bg relative isolate min-h-screen flex flex-col">
            <AppBackground />
            {/* Green hero wash behind the header + page heading — strong at
                the very top, fading into the app-shell gradient so the first
                row of cards overlaps it. */}
            <div
                aria-hidden="true"
                className="dashboard-hero-wash pointer-events-none absolute inset-x-0 top-0 -z-[5] h-[380px]"
            />
            <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1">
                <Outlet context={{ player }} />
            </main>

            <DashboardFooter />

            <BottomPlayer player={player} />

            {/* Floating "sticker" tab, stuck to the right edge of the
                viewport (not the header) — opens a quick-play modal right
                here instead of navigating away to the full /music page. */}
            <button
                onClick={() => setMusicModalOpen(true)}
                aria-label="Open Music"
                title="Music"
                className="fixed right-0 top-24 z-40 flex items-center justify-center w-11 h-11 rounded-l-xl bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 hover:w-12 transition-all duration-150"
            >
                <Music2 size={20} />
            </button>

            <MusicQuickPlayModal open={musicModalOpen} onClose={() => setMusicModalOpen(false)} player={player} />
        </div>
    );
}