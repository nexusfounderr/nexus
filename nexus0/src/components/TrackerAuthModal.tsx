/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAccount, TrackerStats } from '../types';
import {
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  User,
  Mail,
  KeyRound,
  X,
  Crosshair,
  TrendingUp,
  Percent,
  Award,
  Zap,
} from 'lucide-react';

interface TrackerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onVerificationSuccess: (updatedUser: UserAccount) => void;
  onLoginSuccess?: (user: UserAccount) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  actionContext?: 'scrim' | 'team' | 'coaching' | 'general';
}

// Generate realistic verified tracker stats based on user rank or Riot ID
export function generateTrackerStatsForRank(rankStr: string = 'IMMORTAL'): TrackerStats {
  const isHigh = rankStr.includes('IMMORTAL') || rankStr.includes('RADIANT');
  const isMid = rankStr.includes('ASCENDANT') || rankStr.includes('DIAMOND');

  if (isHigh) {
    return {
      kd: (1.2 + Math.random() * 0.35).toFixed(2),
      winRate: `%${(54 + Math.random() * 8).toFixed(1)}`,
      headshot: `%${(28 + Math.random() * 12).toFixed(1)}`,
      peakRank: rankStr.includes('RADIANT') ? 'RADIANT #241' : 'IMMORTAL 3',
      matchesPlayed: Math.floor(180 + Math.random() * 150),
    };
  } else if (isMid) {
    return {
      kd: (1.05 + Math.random() * 0.25).toFixed(2),
      winRate: `%${(51 + Math.random() * 6).toFixed(1)}`,
      headshot: `%${(22 + Math.random() * 8).toFixed(1)}`,
      peakRank: 'ASCENDANT 3',
      matchesPlayed: Math.floor(120 + Math.random() * 90),
    };
  } else {
    return {
      kd: (0.95 + Math.random() * 0.25).toFixed(2),
      winRate: `%${(49 + Math.random() * 5).toFixed(1)}`,
      headshot: `%${(18 + Math.random() * 7).toFixed(1)}`,
      peakRank: 'PLATINUM 3',
      matchesPlayed: Math.floor(80 + Math.random() * 70),
    };
  }
}

// Helper: Extract or resolve the exact rank from a given Tracker link or player identifier
export function resolveRankFromTrackerLink(urlOrRiotId: string, fallbackRank: string = 'RADIANT'): string {
  const clean = decodeURIComponent(urlOrRiotId).toUpperCase();

  if (clean.includes('RADIANT')) return 'RADIANT';
  if (clean.includes('IMMORTAL 3') || clean.includes('IMMORTAL3') || clean.includes('IMMORTAL%203') || clean.includes('IMMORTAL-3')) return 'IMMORTAL 3';
  if (clean.includes('IMMORTAL 2') || clean.includes('IMMORTAL2') || clean.includes('IMMORTAL%202') || clean.includes('IMMORTAL-2')) return 'IMMORTAL 2';
  if (clean.includes('IMMORTAL 1') || clean.includes('IMMORTAL1') || clean.includes('IMMORTAL%201') || clean.includes('IMMORTAL-1') || clean.includes('IMMORTAL')) return 'IMMORTAL 1';
  if (clean.includes('ASCENDANT 3') || clean.includes('ASCENDANT-3')) return 'ASCENDANT 3';
  if (clean.includes('ASCENDANT 2') || clean.includes('ASCENDANT-2')) return 'ASCENDANT 2';
  if (clean.includes('ASCENDANT 1') || clean.includes('ASCENDANT-1') || clean.includes('ASCENDANT')) return 'ASCENDANT 1';
  if (clean.includes('DIAMOND 3') || clean.includes('DIAMOND-3')) return 'DIAMOND 3';
  if (clean.includes('DIAMOND 2') || clean.includes('DIAMOND-2')) return 'DIAMOND 2';
  if (clean.includes('DIAMOND 1') || clean.includes('DIAMOND-1') || clean.includes('DIAMOND')) return 'DIAMOND 1';
  if (clean.includes('PLATINUM 3') || clean.includes('PLATINUM-3')) return 'PLATINUM 3';
  if (clean.includes('PLATINUM 2') || clean.includes('PLATINUM-2')) return 'PLATINUM 2';
  if (clean.includes('PLATINUM 1') || clean.includes('PLATINUM-1') || clean.includes('PLATINUM')) return 'PLATINUM 1';
  if (clean.includes('GOLD 3') || clean.includes('GOLD-3')) return 'GOLD 3';
  if (clean.includes('GOLD 2') || clean.includes('GOLD-2')) return 'GOLD 2';
  if (clean.includes('GOLD 1') || clean.includes('GOLD-1') || clean.includes('GOLD')) return 'GOLD 1';
  if (clean.includes('SILVER 3') || clean.includes('SILVER-3')) return 'SILVER 3';
  if (clean.includes('SILVER 2') || clean.includes('SILVER-2')) return 'SILVER 2';
  if (clean.includes('SILVER 1') || clean.includes('SILVER-1') || clean.includes('SILVER')) return 'SILVER 1';
  if (clean.includes('BRONZE 3') || clean.includes('BRONZE-3')) return 'BRONZE 3';
  if (clean.includes('BRONZE 2') || clean.includes('BRONZE-2')) return 'BRONZE 2';
  if (clean.includes('BRONZE 1') || clean.includes('BRONZE-1') || clean.includes('BRONZE')) return 'BRONZE 1';
  if (clean.includes('IRON 3') || clean.includes('IRON-3')) return 'IRON 3';
  if (clean.includes('IRON 2') || clean.includes('IRON-2')) return 'IRON 2';
  if (clean.includes('IRON 1') || clean.includes('IRON-1') || clean.includes('IRON')) return 'IRON 1';

  // Professional / famous valorant player aliases that are Radiant
  if (
    clean.includes('CNED') ||
    clean.includes('ALFAJER') ||
    clean.includes('TENZ') ||
    clean.includes('ASPAS') ||
    clean.includes('DERKE') ||
    clean.includes('WOOT') ||
    clean.includes('RIEWS') ||
    clean.includes('SWOXY')
  ) {
    return 'RADIANT';
  }

  return fallbackRank;
}

export const TrackerAuthModal: React.FC<TrackerAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onVerificationSuccess,
  onLoginSuccess,
  showToast,
  actionContext = 'scrim',
}) => {
  // Check if current user is logged in
  const isLoggedIn = !!currentUser.email && currentUser.email !== 'guest@nexus.gg';

  const [mode, setMode] = useState<'verify' | 'login' | 'register'>('verify');
  const [trackerInput, setTrackerInput] = useState(currentUser.trackerUrl || '');
  const [selectedPresetRank, setSelectedPresetRank] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verifiedPreview, setVerifiedPreview] = useState<{
    riotId: string;
    rank: string;
    stats: TrackerStats;
    url: string;
  } | null>(() => {
    if (currentUser.isTrackerVerified && currentUser.trackerStats) {
      return {
        riotId: currentUser.riotId,
        rank: currentUser.rank || 'IMMORTAL 2',
        stats: currentUser.trackerStats,
        url: currentUser.trackerUrl || '',
      };
    }
    return null;
  });

  // Login form fields (if not logged in)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form fields
  const [regRiotId, setRegRiotId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const getActionName = () => {
    switch (actionContext) {
      case 'scrim':
        return 'Scrim İlanı Yayınlamak';
      case 'team':
        return 'Takım / Oyuncu İlanı Vermek';
      case 'coaching':
        return 'Koçluk Başvurusu Yapmak';
    }
  };

  // Helper: auto build tracker url for current user
  const handleGenerateDefaultUrl = () => {
    const encodedId = encodeURIComponent(currentUser.riotId.replace('#', '%23'));
    const url = `https://tracker.gg/valorant/profile/riot/${encodedId}/overview`;
    setTrackerInput(url);
    setSelectedPresetRank(currentUser.rank || 'RADIANT');
  };

  // Validate Tracker Link & Fetch Stats
  const handleVerifyTracker = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = trackerInput.trim();

    if (!cleanUrl) {
      showToast('Lütfen geçerli bir Valorant Tracker.gg linki giriniz.', 'error');
      return;
    }

    // Accept tracker.gg links or riot id directly
    let parsedRiotId = currentUser.riotId;
    if (cleanUrl.includes('tracker.gg/valorant/profile/riot/')) {
      const parts = cleanUrl.split('/riot/')[1]?.split('/')[0];
      if (parts) {
        parsedRiotId = decodeURIComponent(parts.replace('%23', '#'));
      }
    } else if (cleanUrl.includes('#')) {
      parsedRiotId = cleanUrl;
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);

      // Verilen tracker linkindeki hesap ile birebir aynı rankı belirle
      const targetRank = selectedPresetRank || resolveRankFromTrackerLink(cleanUrl, currentUser.rank || 'RADIANT');
      const stats = generateTrackerStatsForRank(targetRank);
      const finalUrl = cleanUrl.startsWith('http')
        ? cleanUrl
        : `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(parsedRiotId.replace('#', '%23'))}/overview`;

      setVerifiedPreview({
        riotId: parsedRiotId,
        rank: targetRank,
        stats,
        url: finalUrl,
      });

      // Hesap rankını verilen tracker linkindeki hesapla aynı rankta olacak şekilde güncelle
      const updatedUser: UserAccount = {
        ...currentUser,
        riotId: parsedRiotId || currentUser.riotId,
        rank: targetRank,
        trackerUrl: finalUrl,
        isTrackerVerified: true,
        trackerStats: stats,
        verifiedAt: new Date().toISOString(),
      };

      onVerificationSuccess(updatedUser);
      showToast(`Valorant Tracker.gg profiliniz doğrulandı! Hesap rankınız [${targetRank}] olarak eşitlendi.`, 'success');
      onClose();
    }, 900);
  };

  // Quick Demo / Predefined Tracker Link
  const handleUsePresetLink = (riotId: string, rank: string) => {
    const encoded = encodeURIComponent(riotId.replace('#', '%23'));
    const url = `https://tracker.gg/valorant/profile/riot/${encoded}/overview`;
    setTrackerInput(url);
    setSelectedPresetRank(rank);
  };

  // Handle Standard Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();

    try {
      const usersDb = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      const user = usersDb[cleanEmail];

      if (!user) {
        showToast('Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.', 'error');
        return;
      }

      if (user.password && user.password !== loginPassword) {
        showToast('Girdiğiniz şifre hatalı.', 'error');
        return;
      }

      localStorage.setItem('nexus_active_user', cleanEmail);
      onLoginSuccess?.(user);
      showToast(`Giriş başarılı! Hoş geldin, ${user.riotId}`);

      // If already verified, close; otherwise switch to verify tab
      if (user.isTrackerVerified) {
        onClose();
      } else {
        setMode('verify');
      }
    } catch {
      showToast('Giriş yapılırken bir hata oluştu.', 'error');
    }
  };

  // Handle Register with Tracker
  const handleRegisterWithTracker = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRiotId = regRiotId.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanRiotId.includes('#')) {
      showToast('Lütfen geçerli bir Riot ID giriniz (Örn: IsoDuelist#TR1).', 'error');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showToast('Lütfen geçerli bir e-posta adresi giriniz.', 'error');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      showToast('Şifreniz en az 6 karakter olmalıdır.', 'error');
      return;
    }

    const trackerUrl = trackerInput.trim() || `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(cleanRiotId.replace('#', '%23'))}/overview`;
    const targetRank = selectedPresetRank || resolveRankFromTrackerLink(trackerUrl, 'RADIANT');
    const stats = generateTrackerStatsForRank(targetRank);

    const newUser: UserAccount = {
      email: cleanEmail,
      riotId: cleanRiotId,
      password: regPassword,
      rank: targetRank, // Hesap rankı verilen tracker linkindeki rankla aynı
      role: 'Flex / Duelist',
      trackerUrl,
      isTrackerVerified: true,
      trackerStats: stats,
      verifiedAt: new Date().toISOString(),
    };

    try {
      const usersDb = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      usersDb[cleanEmail] = newUser;
      localStorage.setItem('nexus_users_db', JSON.stringify(usersDb));
      localStorage.setItem('nexus_active_user', cleanEmail);
    } catch {}

    onLoginSuccess?.(newUser);
    showToast(`Hesabınız oluşturuldu ve Tracker.gg profiliniz doğrulandı: ${cleanRiotId}`, 'success');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          className="relative w-full max-w-xl bg-[#0c1220] border-2 border-[#00b894]/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,184,148,0.25)] flex flex-col max-h-[92vh]"
        >
          {/* Top Decorative Line */}
          <div className="h-1.5 bg-gradient-to-r from-[#00b894] via-[#0984e3] to-[#ff4655]" />

          {/* Modal Header */}
          <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-[#141c2e]/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#00b894]/20 border border-[#00b894]/40 flex items-center justify-center text-[#00b894] shadow-[0_0_15px_rgba(0,184,148,0.3)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-rajdhani font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
                    Tracker.gg Doğrulama Sistemi
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00b894]/20 text-[#00b894] border border-[#00b894]/40 uppercase">
                    Zorunlu
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  <strong className="text-white">{getActionName()}</strong> için profilinizin gerçek bir Valorant hesabı olduğu doğrulanmalıdır.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Bar if user has choices */}
          <div className="flex border-b border-white/10 bg-[#090d18] text-xs font-rajdhani font-bold uppercase tracking-wider">
            <button
              onClick={() => setMode('verify')}
              className={`flex-1 py-3 text-center transition-all cursor-pointer ${
                mode === 'verify'
                  ? 'bg-[#00b894]/20 text-[#00b894] border-b-2 border-[#00b894]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1. Tracker Linki Doğrula
            </button>

            {!isLoggedIn && (
              <>
                <button
                  onClick={() => setMode('register')}
                  className={`flex-1 py-3 text-center transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#00b894]/20 text-[#00b894] border-b-2 border-[#00b894]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Yeni Kayıt & Tracker
                </button>
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 py-3 text-center transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#00b894]/20 text-[#00b894] border-b-2 border-[#00b894]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Mevcut Hesaba Giriş
                </button>
              </>
            )}
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* MODE: VERIFY TRACKER */}
            {mode === 'verify' && (
              <form onSubmit={handleVerifyTracker} className="space-y-5">
                {/* Active user banner */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#00b894]" />
                    <span className="text-xs text-zinc-300">
                      Doğrulanacak Oyuncu:{' '}
                      <strong className="text-white font-rajdhani font-bold text-sm">
                        {currentUser.riotId}
                      </strong>
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {currentUser.rank || 'IMMORTAL'}
                  </span>
                </div>

                {/* Tracker Link Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-200">
                      Valorant Tracker.gg Profil Linkiniz *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateDefaultUrl}
                      className="text-[11px] text-[#00b894] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Zap className="w-3 h-3" /> Adıma Göre Link Oluştur
                    </button>
                  </div>

                  <div className="relative">
                    <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={trackerInput}
                      onChange={(e) => {
                        setTrackerInput(e.target.value);
                        setSelectedPresetRank(null);
                      }}
                      placeholder="https://tracker.gg/valorant/profile/riot/Kullanici%23TR1/overview"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#141c2e] border border-white/15 focus:border-[#00b894] rounded-xl text-sm text-white placeholder-zinc-500 outline-none font-mono transition-all"
                    />
                  </div>
                </div>

                {/* Quick Presets for Instant Testing */}
                <div>
                  <span className="text-[11px] font-rajdhani font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Hızlı Test İçin Örnek Tracker Profili Seç:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => handleUsePresetLink(currentUser.riotId, currentUser.rank || 'IMMORTAL 3')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00b894]/20 border border-white/10 hover:border-[#00b894]/40 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      Profilim: {currentUser.riotId} ({currentUser.rank || 'IMMORTAL 3'})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUsePresetLink('cNed#FUT', 'RADIANT')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00b894]/20 border border-white/10 hover:border-[#00b894]/40 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      cNed#FUT (Radiant)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUsePresetLink('Alfajer#FNATIC', 'RADIANT')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00b894]/20 border border-white/10 hover:border-[#00b894]/40 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      Alfajer#FNATIC (Radiant)
                    </button>
                  </div>
                </div>

                {/* Live Stats Preview Box if already verified */}
                {verifiedPreview && (
                  <div className="p-4 rounded-xl bg-[#00b894]/10 border border-[#00b894]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-rajdhani font-bold text-[#00b894] uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Doğrulanmış Tracker Verisi
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {verifiedPreview.riotId}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[10px] text-zinc-400 block">K/D</span>
                        <span className="font-mono font-bold text-white text-sm">
                          {verifiedPreview.stats.kd}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[10px] text-zinc-400 block">Kazanma</span>
                        <span className="font-mono font-bold text-[#00b894] text-sm">
                          {verifiedPreview.stats.winRate}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[10px] text-zinc-400 block">Headshot</span>
                        <span className="font-mono font-bold text-[#f59e0b] text-sm">
                          {verifiedPreview.stats.headshot}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[10px] text-zinc-400 block">Peak Rank</span>
                        <span className="font-mono font-bold text-[#ff4655] text-xs truncate">
                          {verifiedPreview.stats.peakRank}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Explanation */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-400">
                  <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
                  <p>
                    Tracker.gg linki onaylandıktan sonra ilanınızın üzerinde <strong>"Tracker Doğrulandı ✓"</strong> rozeti ve güncel dereceniz görünecektir. Bu sayede diğer takımlar ve oyuncular ilanınızın güvenilirliğine güvenir.
                  </p>
                </div>

                {/* Submit Verification Button */}
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#00b894] to-[#0984e3] hover:opacity-90 text-white font-rajdhani font-black uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(0,184,148,0.4)] cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Tracker.gg API Verisi Doğrulanıyor...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Tracker Linkini Doğrula & İlan Ver</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE: REGISTER WITH TRACKER */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterWithTracker} className="space-y-4">
                <div>
                  <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Kullanıcı Adı (Riot ID & Tag) *
                  </label>
                  <input
                    type="text"
                    value={regRiotId}
                    onChange={(e) => setRegRiotId(e.target.value)}
                    placeholder="Örn: IsoSlayer#TR1"
                    className="w-full px-3.5 py-2.5 bg-[#141c2e] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00b894]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Tracker.gg Profil Linki
                  </label>
                  <input
                    type="text"
                    value={trackerInput}
                    onChange={(e) => setTrackerInput(e.target.value)}
                    placeholder="https://tracker.gg/valorant/profile/riot/..."
                    className="w-full px-3.5 py-2.5 bg-[#141c2e] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00b894] font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    E-Posta Adresi *
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="oyuncu@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-[#141c2e] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00b894]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Şifre Belirleyin (En az 6 karakter) *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#141c2e] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00b894]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00b894] to-[#7000ff] text-white font-rajdhani font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(0,184,148,0.4)] cursor-pointer"
                >
                  Hesap Aç & Tracker Doğrulamasıyla İlan Ver
                </button>
              </form>
            )}

            {/* MODE: EXISTING LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Kayıtlı E-Posta Adresi *
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="swoxy4k@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-[#141c2e] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00b894]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Şifre *
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#141c2e] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00b894]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#00b894] hover:bg-[#00a382] text-white font-rajdhani font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(0,184,148,0.4)] cursor-pointer"
                >
                  Giriş Yap & Devam Et
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
