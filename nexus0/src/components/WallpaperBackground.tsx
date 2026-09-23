import React, { useRef, useEffect } from 'react';

interface WallpaperBackgroundProps {
  isPlaying: boolean;
  isPeeking: boolean;
}

export const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({ isPlaying, isPeeking }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted by browser until user gesture
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[#070913] pointer-events-none select-none">
      <video
        ref={videoRef}
        className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover opacity-85 transition-opacity duration-700"
        autoPlay
        muted
        loop
        playsInline
        poster="https://motionbgs.com/media/5447/iso-valorant.jpg"
      >
        <source src="https://motionbgs.com/media/5447/iso-valorant.1920x1080.mp4" type="video/mp4" />
        <source src="https://motionbgs.com/media/5447/iso-valorant.960x540.mp4" type="video/mp4" />
      </video>

      {/* Cybernetic Dark Overlay with Iso radial glow */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          isPeeking
            ? 'bg-black/20 backdrop-blur-none'
            : 'bg-[radial-gradient(circle_at_center,rgba(13,10,28,0.65)_0%,rgba(7,9,19,0.88)_100%)] backdrop-blur-[7px]'
        }`}
      />

      {/* Subtle Valorant Iso grid line accents */}
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,#ff465508_1px,transparent_1px),linear-gradient(to_bottom,#7000ff08_1px,transparent_1px)] bg-[size:4rem_4rem] transition-opacity duration-500 ${isPeeking ? 'opacity-0' : 'opacity-100'}`} />
    </div>
  );
};
