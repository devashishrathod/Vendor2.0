import { useCallback, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import MusicComingSoon from "../components/MusicComingSoon";

/**
 * MusicLayout
 * Wraps every /music* route. Playback state lives HERE (not inside
 * MusicPage) specifically so it survives navigating to a collection's own
 * page and back — Spotify-style: the bottom player never unmounts just
 * because you opened an album. Child routes read it via useOutletContext().
 *
 * The section isn't launched yet: it opens on a "Coming soon" screen, and
 * "See what we're building" reveals the in-progress pages below a preview
 * banner. The choice lives here, so it holds while moving between /music
 * routes and resets once the vendor leaves the section.
 */
export default function MusicLayout() {
  const { player } = useOutletContext();
  const [showPreview, setShowPreview] = useState(false);

  const openPreview = useCallback(() => setShowPreview(true), []);
  const closePreview = useCallback(() => setShowPreview(false), []);

  if (!showPreview) return <MusicComingSoon onPreview={openPreview} />;

  return (
    <>
      <div className="bg-app px-4 pt-4 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-800 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
          <span className="flex items-center gap-2">
            <Construction size={15} className="shrink-0" />
            Preview — this section is still being built. Some things may not work yet.
          </span>
          <button
            type="button"
            onClick={closePreview}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-amber-800 ring-1 ring-amber-200 transition-colors hover:bg-amber-100 sm:self-auto dark:bg-transparent dark:text-amber-300 dark:ring-amber-500/30 dark:hover:bg-amber-500/10"
          >
            <ArrowLeft size={13} />
            Back to Coming soon
          </button>
        </div>
      </div>
      <Outlet context={{ player }} />
    </>
  );
}
