/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Server,
  Zap,
  CheckCircle2,
  Radio,
  Swords,
  Users,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type DeployListingType = 'scrim' | 'team' | 'coaching';

interface ValorantListingDeployLoaderProps {
  isOpen: boolean;
  listingType: DeployListingType;
  title: string;
  authorRiotId: string;
  rank?: string;
  trackerUrl?: string;
  onComplete: () => void;
}

export const ValorantListingDeployLoader: React.FC<ValorantListingDeployLoaderProps> = ({
  isOpen,
  listingType,
  title,
  authorRiotId,
  rank = 'IMMORTAL',
  trackerUrl,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const steps = [
    {
      title: 'Tracker.gg & Riot Kimlik Doğrulaması',
      detail: `${authorRiotId} oyuncu hesabı ve Vanguard statüsü onaylanıyor...`,
      icon: <ShieldCheck className="w-4 h-4 text-[#00b894]" />,
    },
    {
      title: 'Sunucu ve Ping Eşitlemesi (TR / Frankfurt)',
      detail: 'Istanbul veri merkezine düşük gecikmeli soket rotası atanıyor...',
      icon: <Server className="w-4 h-4 text-[#0984e3]" />,
    },
    {
      title: 'Anti-Smurf & MMR Eşleştirme Filtresi',
      detail: `${rank} dereceli havuzuyla uyumlu rekabetçi protokolü hazırlanıyor...`,
      icon: <Zap className="w-4 h-4 text-[#f59e0b]" />,
    },
    {
      title: 'Nexus Espor Ağına İlan Dağıtımı',
      detail: 'Canlı lobi ve arama akışına anlık paket olarak gönderiliyor...',
      icon: <Radio className="w-4 h-4 text-[#ff4655] animate-pulse" />,
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setActiveStep(0);
      setIsDone(false);
      return;
    }

    const startTime = Date.now();
    const duration = 2100; // 2.1 seconds total

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 28) {
        setActiveStep(0);
      } else if (pct < 55) {
        setActiveStep(1);
      } else if (pct < 85) {
        setActiveStep(2);
      } else {
        setActiveStep(3);
      }

      if (pct >= 100) {
        clearInterval(interval);
        setIsDone(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const getTypeLabel = () => {
    switch (listingType) {
      case 'scrim':
        return { label: 'SCRIM LOBİSİ', color: '#ff4655', icon: <Swords className="w-4 h-4" /> };
      case 'team':
        return { label: 'TAKIM & OYUNCU İLANI', color: '#00b894', icon: <Users className="w-4 h-4" /> };
      case 'coaching':
        return { label: 'KOÇLUK BAŞVURUSU', color: '#7000ff', icon: <Award className="w-4 h-4" /> };
    }
  };

  const typeConfig = getTypeLabel();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none">
        {/* Tactical Background Grid & Ambient Glare */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff4655]/15 via-transparent to-black pointer-events-none" />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#0a0f1d] border-2 border-[#ff4655]/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,70,85,0.35)]"
        >
          {/* Top Valorant Header Strip */}
          <div className="bg-gradient-to-r from-[#ff4655] via-[#a855f7] to-[#ff4655] p-[2px]">
            <div className="bg-[#0a0f1d] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff4655] animate-ping" />
                <span className="font-rajdhani font-black text-sm tracking-widest text-[#ff4655] uppercase">
                  VALORANT PROTOKOLÜ // İLAN DAĞITIMI
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#ff4655]/20 border border-[#ff4655]/40 text-[11px] font-mono font-bold text-white uppercase">
                {typeConfig.icon}
                <span>{typeConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Target Listing Summary */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-rajdhani font-bold text-zinc-400 uppercase tracking-wider block">
                  Yayınlanan Başlık:
                </span>
                <span className="font-rajdhani font-black text-lg text-white">
                  "{title}"
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-400 font-mono">Yazar: {authorRiotId}</span>
                  {trackerUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#00b894] bg-[#00b894]/15 px-1.5 py-0.5 rounded border border-[#00b894]/30">
                      <ShieldCheck className="w-3 h-3" /> Tracker Onaylı
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-rajdhani font-bold text-zinc-400 uppercase tracking-wider block">
                  Derece
                </span>
                <span className="font-rajdhani font-extrabold text-sm text-[#f59e0b] px-2 py-0.5 rounded bg-[#f59e0b]/15 border border-[#f59e0b]/30">
                  {rank}
                </span>
              </div>
            </div>

            {/* Tactical Progress Meter */}
            <div>
              <div className="flex items-center justify-between text-xs font-rajdhani font-bold uppercase tracking-wider mb-2">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#ff4655] animate-pulse" />
                  <span>Sistem Senkronizasyonu</span>
                </span>
                <span className="font-mono text-base font-black text-[#ff4655]">
                  %{progress}
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff4655] via-[#a855f7] to-[#00b894] shadow-[0_0_15px_rgba(255,70,85,0.7)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-2.5">
              {steps.map((step, idx) => {
                const isFinished = progress >= (idx + 1) * 25 || isDone;
                const isCurrent = activeStep === idx && !isFinished;

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-300 ${
                      isFinished
                        ? 'bg-[#00b894]/10 border-[#00b894]/30 text-zinc-200'
                        : isCurrent
                        ? 'bg-[#ff4655]/15 border-[#ff4655]/50 text-white shadow-[0_0_10px_rgba(255,70,85,0.2)]'
                        : 'bg-white/[0.02] border-white/5 text-zinc-500 opacity-60'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isFinished ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00b894]" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-rajdhani font-bold text-xs uppercase tracking-wider">
                          {step.title}
                        </span>
                        {isFinished && (
                          <span className="text-[10px] font-mono font-bold text-[#00b894]">
                            [TAMAMLANDI]
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-mono font-bold text-[#ff4655] animate-pulse">
                            [İŞLENİYOR...]
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Finalize Badge */}
            {isDone && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-3 rounded-xl bg-gradient-to-r from-[#00b894]/20 via-[#00b894]/30 to-[#00b894]/20 border border-[#00b894]/50 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-[#00b894] font-rajdhani font-black text-sm uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                  <span>ONAYLANDI! İLAN LİSTEYE DÜŞÜRÜLÜYOR</span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
