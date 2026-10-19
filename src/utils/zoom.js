/**
 * Ratio between on-screen pixels and CSS pixels caused by the app-wide CSS
 * `zoom` on <html> (see --app-zoom in index.css). getBoundingClientRect()
 * returns on-screen pixels in browsers that apply zoom to it, while
 * `position: fixed` top/left inside the zoomed page are CSS pixels — divide
 * a measured rect by this before using it as a position. Measured rather
 * than read from the CSS variable, so it's correct whichever way a given
 * browser reports rects (it's simply 1 where no conversion is needed).
 * @returns {number}
 */
export function getZoomScale() {
  const body = typeof document !== "undefined" ? document.body : null;
  if (!body || !body.offsetWidth) return 1;
  const scale = body.getBoundingClientRect().width / body.offsetWidth;
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}
