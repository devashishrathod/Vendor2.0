import { useState } from "react";

/**
 * Icon image from the backend (category / sub-category `image`), falling
 * back to a Lucide icon when there's no URL or it fails to load.
 * @param {{
 *   src?: string|null,
 *   fallback?: import('react').ElementType,
 *   size?: number,           - fallback icon size in px
 *   className?: string,      - classes for the <img>
 *   iconClassName?: string,  - classes for the fallback icon
 * }} props
 */
export default function RemoteIcon({ src, fallback: Fallback, size = 20, className = "", iconClassName = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (src && failedSrc !== src) {
    return <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} className={`object-contain ${className}`} />;
  }
  return Fallback ? <Fallback size={size} strokeWidth={1.8} className={iconClassName} aria-hidden="true" /> : null;
}
