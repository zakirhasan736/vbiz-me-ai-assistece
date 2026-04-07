import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function IntroVideoPlayer({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      // Attempt to play unmuted first
      videoRef.current.muted = false;
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Browser blocked unmuted autoplay.", error);
          // Fallback to muted autoplay
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(console.error);
          }
        });
      }
    }
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
    >
      <video
        ref={videoRef}
        src="https://app.vbizme.com/storage/ecard/videos/91/Animation%20Vertical-2.mp4"
        playsInline
        onEnded={onComplete}
        className="w-full h-full object-cover opacity-80"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
         <h1 className="text-white text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl">vBiz Me</h1>
         <p className="text-white text-xl md:text-3xl drop-shadow-xl font-light">Your Digital Identity</p>
      </div>
      
      <div className="absolute bottom-12 right-8 md:right-12 flex items-center gap-3">
        <button
          onClick={toggleMute}
          className="cursor-pointer bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition-colors border border-white/30 shadow-2xl flex items-center justify-center"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <button
          onClick={onComplete}
          className="cursor-pointer bg-white/20 hover:bg-white/40 text-white px-8 py-3 rounded-full backdrop-blur-md transition-colors text-lg font-medium border border-white/30 shadow-2xl"
        >
          Skip Intro
        </button>
      </div>
    </motion.div>
  );
}
