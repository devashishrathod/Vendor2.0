import { DotLottieReact } from '@lottiefiles/dotlottie-react';

/**
 * Reusable Lottie animation player.
 *
 * `src` accepts either:
 *   - A LottieFiles URL ending in `.lottie` (preferred — smaller, faster)
 *   - A `.json` animation URL/import
 *   - A local file imported from src/assets (e.g. `import wave from '../../assets/wave.lottie'`)
 *
 * Usage:
 *   <LottieAnimation src="https://lottie.host/xxxxxxxx/yyyyyyyy.lottie" className="w-24 h-24" />
 *   <LottieAnimation src={myLocalFile} loop={false} autoplay={false} onComplete={...} />
 */
const LottieAnimation = ({
  src,
  className = '',
  loop = true,
  autoplay = true,
  speed = 1,
  ...rest
}) => {
  if (!src) return null;

  return (
    <DotLottieReact
      src={src}
      loop={loop}
      autoplay={autoplay}
      speed={speed}
      className={className}
      {...rest}
    />
  );
};

export default LottieAnimation;
