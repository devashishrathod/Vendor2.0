import { Outlet } from "react-router-dom";
import BottomPlayer from "../components/BottomPlayer";
import { usePlayer } from "../hooks/usePlayer";

/**
 * MusicLayout
 * Wraps every /music* route. Playback state lives HERE (not inside
 * MusicPage) specifically so it survives navigating to a collection's own
 * page and back — Spotify-style: the bottom player never unmounts just
 * because you opened an album. Child routes read it via useOutletContext().
 */
export default function MusicLayout() {
  const player = usePlayer();

  return (
    <>
      <Outlet context={{ player }} />
      <BottomPlayer player={player} />
    </>
  );
}
