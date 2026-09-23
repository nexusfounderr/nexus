import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield } from 'lucide-react';

interface IsoTransitionProps {
  isVisible: boolean;
  message?: string;
}

export const IsoTransition: React.FC<IsoTransitionProps> = ({
  isVisible,
  message = 'Kimlik doğrulanıyor, Iso eşliğinde Nexus Esports arenasına aktarılıyorsunuz...',
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="iso-transition-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070913]/92 backdrop-blur-xl p-4 select-none"
        >
          <motion.div
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="w-[340px] max-w-[90vw] rounded-2xl overflow-hidden border border-[#a855f7]/40 bg-[#0e1424]/90 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(112,0,255,0.25)] flex flex-col items-center pb-6 text-center"
          >
            {/* Poster Header */}
            <div className="relative w-full h-[190px] overflow-hidden">
              <img
                src="https://motionbgs.com/media/5447/iso-valorant.jpg"
                alt="Valorant Iso Hologram"
                className="w-full h-full object-cover object-top filter contrast-[1.15] saturate-[1.2] animate-zoom-pulse"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0e1424]/40 to-[#0e1424]" />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 border border-[#a855f7]/50 backdrop-blur-md">
                <Shield className="w-3.5 h-3.5 text-[#ff4655]" />
                <span className="font-rajdhani text-[11px] font-bold text-white tracking-widest uppercase">
                  ISO PROTOCOL
                </span>
              </div>
            </div>

            {/* Glowing Dual Spinner */}
            <div className="relative my-4">
              <div className="w-12 h-12 rounded-full border-3 border-white/10 border-t-[#ff4655] border-r-[#a855f7] animate-spin-fast shadow-[0_0_15px_rgba(255,70,85,0.4)]" />
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#7000ff]" />
            </div>

            {/* Status message */}
            <p className="font-rajdhani text-sm font-bold text-white uppercase tracking-wider px-6 leading-relaxed">
              {message}
            </p>

            {/* Sub-status indicator */}
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#00b894] animate-pulse" />
              <span className="text-[11px] text-[#a4b0be] font-mono tracking-wider">
                BAĞLANTI: AMSTERDAM TIER-1 (18ms)
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
