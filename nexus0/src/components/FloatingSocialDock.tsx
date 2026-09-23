import React from 'react';
import { MessageSquare, Users, UserPlus, ExternalLink } from 'lucide-react';
import { ActiveTab } from '../types';
import { DISCORD_CONFIG } from '../utils/discord';

interface FloatingSocialDockProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddFriendModal: () => void;
  friendsCount: number;
  incomingRequestsCount: number;
}

export const FloatingSocialDock: React.FC<FloatingSocialDockProps> = ({
  activeTab,
  onTabChange,
  onOpenAddFriendModal,
  friendsCount,
  incomingRequestsCount,
}) => {
  return (
    <aside aria-label="Hızlı Sosyal Menü" className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-[#0a0f1b]/95 border border-[#a855f7]/40 p-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(112,0,255,0.3)] backdrop-blur-xl">
      {/* Discord Community Server Link */}
      <a
        href={DISCORD_CONFIG.serverInvite}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer bg-[#5865F2]/20 hover:bg-[#5865F2] text-[#5865F2] hover:text-white border border-[#5865F2]/40 shadow-[0_0_12px_rgba(88,101,242,0.3)]"
        title="Resmi Nexus Discord Sunucusuna Katıl"
      >
        <span className="text-xs">💬</span>
        <span className="hidden sm:inline">Discord</span>
        <ExternalLink className="w-3 h-3 opacity-70" />
      </a>

      {/* Quick Add Friend Button */}
      <button
        onClick={onOpenAddFriendModal}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white text-xs font-rajdhani font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(112,0,255,0.5)] transition-all cursor-pointer"
        title="Arkadaşlık İsteği Gönder"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">+ İstek Gönder</span>
      </button>

      {/* Friends Tab Shortcut with Incoming Requests Alert */}
      <button
        onClick={() => onTabChange('friends')}
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer border ${
          activeTab === 'friends'
            ? 'bg-[#00b894] text-white border-[#00b894] shadow-[0_0_12px_rgba(0,184,148,0.5)]'
            : 'bg-[#141c2e] text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
        }`}
        title="Arkadaş Listesi ve İstekler"
      >
        <Users className="w-3.5 h-3.5 text-[#00b894]" />
        <span>Arkadaşlar ({friendsCount})</span>
        {incomingRequestsCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#ff4655] text-white animate-pulse">
            +{incomingRequestsCount}
          </span>
        )}
      </button>

      {/* Chat Tab Shortcut */}
      <button
        onClick={() => onTabChange('chat')}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer border ${
          activeTab === 'chat'
            ? 'bg-[#ff4655] text-white border-[#ff4655] shadow-[0_0_12px_rgba(255,70,85,0.5)]'
            : 'bg-[#141c2e] text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
        }`}
        title="Sohbet ve Lobi"
      >
        <MessageSquare className="w-3.5 h-3.5 text-[#ff4655]" />
        <span>Sohbet & Lobi</span>
        <span className="w-2 h-2 rounded-full bg-[#00b894] animate-pulse" />
      </button>
    </aside>
  );
};
