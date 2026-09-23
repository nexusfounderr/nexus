import React, { useState } from 'react';
import { ActiveTab, UserAccount } from '../types';
import { Swords, Users, MessageSquare, UserCheck, LogOut, User, Award, ShieldCheck, Settings, ExternalLink, LogIn, UserPlus, Volume2, VolumeX } from 'lucide-react';
import { DISCORD_CONFIG } from '../utils/discord';
import { soundManager } from '../utils/soundEffects';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: UserAccount;
  onRequestLogout: () => void;
  onOpenAddFriend?: () => void;
  onOpenTrackerAuth?: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
  friendsCount: number;
  incomingRequestsCount: number;
  isAdmin: boolean;
  pendingCoachApprovalsCount: number;
  onAdminLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onRequestLogout,
  onOpenTrackerAuth,
  onOpenAuthModal,
  friendsCount,
  incomingRequestsCount,
  isAdmin,
  pendingCoachApprovalsCount,
  onAdminLogout,
}) => {
  const isGuest = currentUser.email === 'oyuncu@nexus.gg' && !currentUser.password;
  const [isMuted, setIsMuted] = useState(() => soundManager.getSettings().isMuted);

  const handleToggleSound = () => {
    const updatedMuted = soundManager.toggleMute();
    setIsMuted(updatedMuted);
    if (!updatedMuted) {
      soundManager.playMessageSound();
    }
  };

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    hasAlert?: boolean;
    color: string;
  }[] = [
    { id: 'scrim', label: 'Scrim & Oyna', icon: <Swords className="w-4 h-4" />, color: 'from-[#ff4655] to-[#c92a38]' },
    { id: 'teams', label: 'Takım & Oyuncu İlanları', icon: <Users className="w-4 h-4" />, color: 'from-[#00b894] to-[#009475]' },
    { id: 'coaching', label: 'Koçluk & Başvuru', icon: <Award className="w-4 h-4" />, color: 'from-[#7000ff] to-[#a855f7]' },
    { id: 'chat', label: 'Sohbet & Lobi', icon: <MessageSquare className="w-4 h-4" />, color: 'from-[#ff4655] to-[#e63946]' },
    {
      id: 'friends',
      label: 'Arkadaşlar & İstekler',
      icon: <UserCheck className="w-4 h-4" />,
      badge: incomingRequestsCount > 0 ? incomingRequestsCount : friendsCount,
      hasAlert: incomingRequestsCount > 0,
      color: 'from-[#00b894] to-[#0984e3]',
    },
    // YALNIZCA VE YALNIZCA GİZLİ YÖNETİCİ AKTİFLEŞTİRİLDİĞİNDE GÖRÜNÜR
    ...(isAdmin
      ? [
          {
            id: 'admin' as ActiveTab,
            label: 'Admin Paneli',
            icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
            badge: pendingCoachApprovalsCount > 0 ? pendingCoachApprovalsCount : undefined,
            hasAlert: pendingCoachApprovalsCount > 0,
            color: 'from-[#d97706] to-[#f59e0b]',
          },
        ]
      : []),
    {
      id: 'settings',
      label: 'Ayarlar',
      icon: <Settings className="w-4 h-4" />,
      color: 'from-[#7000ff] to-[#a855f7]',
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0a0f1b]/95 border-b border-[#ff4655]/25 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4655] to-[#7000ff] p-0.5 shadow-[0_0_15px_rgba(255,70,85,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0f1b] rounded-[10px] flex items-center justify-center">
              <span className="font-rajdhani font-black text-xl text-[#ff4655]">N</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-rajdhani font-black text-xl tracking-wider text-[#ff4655] drop-shadow-[0_0_10px_rgba(255,70,85,0.4)]">
                NEXUS
              </span>
              <span className="font-rajdhani font-bold text-xs tracking-widest text-[#a855f7] bg-[#7000ff]/20 px-2 py-0.5 rounded border border-[#a855f7]/30">
                ARENA
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#a4b0be]">
              <span className="w-2 h-2 rounded-full bg-[#00b894] animate-pulse" />
              <span className="font-medium tracking-wide">CANLI OYUNCU PLATFORMU</span>
            </div>
          </div>
        </div>

        {/* Discord & Quick Action Links */}
        <div className="order-3 md:order-2 flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                activeTab === 'admin'
                  ? 'bg-[#f59e0b] text-black border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-[#f59e0b]/20 hover:bg-[#f59e0b]/35 text-[#f59e0b] border-[#f59e0b]/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              }`}
              title="Yönetici Paneli"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Admin Paneli</span>
              {pendingCoachApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#ff4655] text-white shadow-[0_0_8px_rgba(255,70,85,0.8)] animate-pulse">
                  {pendingCoachApprovalsCount}
                </span>
              )}
            </button>
          )}

          <a
            href={DISCORD_CONFIG.serverInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2] text-[#5865F2] hover:text-white border border-[#5865F2]/40 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(88,101,242,0.25)] cursor-pointer"
            title="Nexus Valorant Resmi Discord Sunucusuna Katıl"
          >
            <span className="text-sm">💬</span>
            <span className="hidden sm:inline">Discord</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>

        {/* User Account / Login / Register / Logout Section */}
        <div className="order-2 md:order-3 flex items-center gap-2 shrink-0">
          {/* User Profile Card */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#141c2e] border border-white/10 text-white">
            <User className="w-3.5 h-3.5 text-[#a855f7]" />
            <span id="displayUserTag" className="font-rajdhani font-bold text-xs sm:text-sm tracking-wide text-zinc-100">
              {currentUser.riotId || 'IsoPlayer#TR1'}
            </span>
            <span className="text-[10px] bg-[#ff4655]/20 text-[#ff4655] px-1.5 py-0.5 rounded border border-[#ff4655]/40 font-bold">
              {currentUser.rank || 'IMMORTAL'}
            </span>

            {/* Tracker status badge */}
            {currentUser.isTrackerVerified ? (
              <button
                type="button"
                onClick={onOpenTrackerAuth}
                className="flex items-center gap-1 text-[10px] font-mono text-[#00b894] hover:text-[#55efc4] bg-[#00b894]/15 hover:bg-[#00b894]/25 px-1.5 py-0.5 rounded border border-[#00b894]/30 cursor-pointer transition-all"
                title="Tracker.gg Profiliniz Doğrulandı"
              >
                <ShieldCheck className="w-3 h-3 text-[#00b894]" />
                <span className="hidden sm:inline">Tracker ✓</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenTrackerAuth}
                className="flex items-center gap-1 text-[10px] font-rajdhani font-bold text-[#f59e0b] hover:text-white bg-[#f59e0b]/20 hover:bg-[#f59e0b]/35 px-2 py-0.5 rounded border border-[#f59e0b]/40 cursor-pointer transition-all"
                title="Tracker.gg profilinizi bağlayın"
              >
                <ShieldCheck className="w-3 h-3 text-[#f59e0b]" />
                <span className="hidden sm:inline">Tracker Bağla</span>
              </button>
            )}

            {isAdmin && (
              <span className="text-[9px] bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.5 rounded border border-[#f59e0b]/40 font-bold uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>

          {/* Admin Exit Button - SADECE YÖNETİCİ AKTİFKEN GÖRÜNÜR */}
          {isAdmin && onAdminLogout && (
            <button
              type="button"
              onClick={onAdminLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f59e0b]/15 hover:bg-[#ff4655]/20 text-[#f59e0b] hover:text-[#ff4655] border border-[#f59e0b]/30 hover:border-[#ff4655]/40 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
              title="Yönetici Yetkisini Kapat"
            >
              <span className="text-[11px]">Admin Çıkışı</span>
            </button>
          )}

          {/* Guest Auth Buttons: Giriş Yap / Kayıt Ol */}
          {isGuest ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/40 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Giriş Yap</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white border border-[#a855f7]/40 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kayıt Ol</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Lobby Sound Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-rajdhani font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  !isMuted
                    ? 'bg-[#0984e3]/20 hover:bg-[#0984e3]/30 text-[#74b9ff] border-[#0984e3]/40 shadow-[0_0_10px_rgba(9,132,227,0.3)]'
                    : 'bg-[#141c2e] hover:bg-white/10 text-zinc-400 border-white/10'
                }`}
                title={!isMuted ? 'Lobi Sesleri Açık (Sessize Al)' : 'Lobi Sesleri Kapalı (Sesi Aç)'}
              >
                {!isMuted ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#74b9ff]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span className="hidden md:inline">{!isMuted ? 'Ses Açık' : 'Sessiz'}</span>
              </button>

              <button
                id="btn-settings"
                onClick={() => onTabChange('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-rajdhani font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#7000ff] text-white border-[#7000ff] shadow-[0_0_12px_rgba(112,0,255,0.5)]'
                    : 'bg-[#141c2e] hover:bg-white/10 text-zinc-300 hover:text-white border-white/10'
                }`}
                title="Hesap Ayarları"
              >
                <Settings className="w-3.5 h-3.5 text-[#a855f7]" />
                <span className="hidden sm:inline">Ayarlar</span>
              </button>

              <button
                id="btn-logout"
                onClick={onRequestLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/40 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                title="Hesaptan Çıkış Yap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs Bar */}
        <div className="w-full order-4 pt-1 flex items-center justify-between border-t border-white/5 overflow-x-auto">
          <nav className="flex items-center gap-1.5 py-1 min-w-max">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg scale-100 border border-white/20`
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        item.hasAlert
                          ? 'bg-[#ff4655] text-white animate-pulse'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
