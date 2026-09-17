import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import MusicHero from "../components/MusicHero";
import SectionHeading from "../components/SectionHeading";
import LanguagePills from "../components/LanguagePills";
import OutletCollectionCard from "../components/OutletCollectionCard";
import TrendingSongCard from "../components/TrendingSongCard";
import TrydoodOffersBanner from "../components/TrydoodOffersBanner";
import CollectionRow from "../components/CollectionRow";

import { useCollections } from "../hooks/useCollections";
import { useSongDurations } from "../hooks/useSongDurations";

const OUTLET_PREVIEW_COUNT = 4;
const TRENDING_PREVIEW_COUNT = 6;
const TRENDING_QUEUE_NAME = "Trending Songs";

export default function MusicPage() {
  const { player } = useOutletContext();
  const navigate = useNavigate();
  const { mood, language, artist, trending, loading } = useCollections();
  const durations = useSongDurations(trending);

  const [showAllOutlet, setShowAllOutlet] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);

  const visibleOutlet = showAllOutlet ? mood : mood.slice(0, OUTLET_PREVIEW_COUNT);
  const visibleTrending = showAllTrending ? trending : trending.slice(0, TRENDING_PREVIEW_COUNT);

  const openCollection = (collection) => navigate(`/music/collection/${collection.id}`);

  const handlePlayRecommended = () => {
    if (!trending.length) return;
    player.playCollection({ name: "Recommended for You", songs: trending });
  };

  const handlePlayTrendingSong = (song) => {
    const index = trending.findIndex((s) => s.id === song.id);
    player.playSongInCollection({ name: TRENDING_QUEUE_NAME, songs: trending }, index);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-28">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Music</h1>
          <p className="text-xs text-gray-400 mt-1">Set the perfect mood for your customers</p>
        </div>

        <MusicHero onPlayRecommended={handlePlayRecommended} />

        {loading ? (
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Clicking a language pill opens that language's own page —
                same "open the album" pattern as every other collection here. */}
            <LanguagePills languages={language} onSelect={openCollection} />

            {/* Made for Your Outlet — clicking a card opens its full album
                page; the small corner play button (revealed on hover)
                quick-plays it right away without leaving this page. */}
            <section className="mb-8">
              <SectionHeading
                title="Made for Your Outlet"
                subtitle="Playlists curated for salons, spas and beauty businesses"
                expanded={showAllOutlet}
                onToggleViewAll={mood.length > OUTLET_PREVIEW_COUNT ? () => setShowAllOutlet((v) => !v) : undefined}
              />
              <div className="flex flex-wrap gap-4">
                {visibleOutlet.map((collection) => (
                  <OutletCollectionCard
                    key={collection.id}
                    collection={collection}
                    onOpen={openCollection}
                    onQuickPlay={player.playCollection}
                  />
                ))}
              </div>
            </section>

            {/* Hero/artist albums — same open-album + quick-play pattern. */}
            <CollectionRow
              title="Hero Albums"
              collections={artist}
              onOpen={openCollection}
              onQuickPlay={player.playCollection}
            />

            <section className="mb-8">
              <SectionHeading
                title="Trending Songs"
                subtitle="Most played by businesses like yours"
                expanded={showAllTrending}
                onToggleViewAll={trending.length > TRENDING_PREVIEW_COUNT ? () => setShowAllTrending((v) => !v) : undefined}
              />
              <div className="flex flex-wrap gap-4">
                {visibleTrending.map((song) => (
                  <TrendingSongCard
                    key={song.id}
                    song={song}
                    isActive={player.queueName === TRENDING_QUEUE_NAME && player.activeSong?.id === song.id}
                    isPlaying={player.isPlaying}
                    duration={durations[song.id]}
                    onPlay={handlePlayTrendingSong}
                  />
                ))}
              </div>
            </section>

            <TrydoodOffersBanner />
          </>
        )}
      </div>
    </div>
  );
}
