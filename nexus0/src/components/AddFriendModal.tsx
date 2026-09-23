import React, { useState, useMemo } from 'react';
import { UserPlus, X, Send, Sparkles, Search, CheckCircle, ShieldAlert } from 'lucide-react';
import { UserAccount, FriendItem, FriendRequest } from '../types';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  friends: FriendItem[];
  friendRequests: FriendRequest[];
  onSendRequest: (riotId: string) => void;
  registeredUsers: UserAccount[];
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  friends,
  friendRequests,
  onSendRequest,
  registeredUsers,
}) => {
  const [riotIdInput, setRiotIdInput] = useState('');

  // Other registered users that are not current user, not friends, and no pending request
  const availablePlayers = useMemo(() => {
    return registeredUsers.filter((u) => {
      if (!u.riotId) return false;
      if (u.riotId.toLowerCase() === currentUser.riotId.toLowerCase()) return false;
      if (friends.some((f) => f.riotId.toLowerCase() === u.riotId.toLowerCase())) return false;
      if (
        friendRequests.some(
          (r) =>
            r.status === 'pending' &&
            ((r.fromRiotId.toLowerCase() === currentUser.riotId.toLowerCase() &&
              r.toRiotId.toLowerCase() === u.riotId.toLowerCase()) ||
              (r.toRiotId.toLowerCase() === currentUser.riotId.toLowerCase() &&
                r.fromRiotId.toLowerCase() === u.riotId.toLowerCase()))
        )
      ) {
        return false;
      }
      return true;
    });
  }, [registeredUsers, currentUser, friends, friendRequests]);

  // Filter automatically as letters are typed in real-time
  const filteredPlayers = useMemo(() => {
    const query = riotIdInput.trim().toLowerCase();
    if (!query) return availablePlayers;

    return availablePlayers.filter((player) => {
      const matchRiotId = player.riotId.toLowerCase().includes(query);
      const matchRole = player.role?.toLowerCase().includes(query);
      const matchRank = player.rank?.toLowerCase().includes(query);
      return matchRiotId || matchRole || matchRank;
    });
  }, [availablePlayers, riotIdInput]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riotIdInput.trim()) return;
    onSendRequest(riotIdInput.trim());
    setRiotIdInput('');
    onClose();
  };

  const handleSelectAndSend = (targetRiotId: string) => {
    onSendRequest(targetRiotId);
    setRiotIdInput('');
    onClose();
  };

  const handleSelectName = (targetRiotId: string) => {
    setRiotIdInput(targetRiotId);
  };

  // Helper to highlight matching substring in Riot ID
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={index} className="text-[#a855f7] bg-[#7000ff]/20 font-black px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-rajdhani">
      <div className="w-full max-w-lg rounded-2xl bg-[#0d1424] border border-[#a855f7]/50 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(112,0,255,0.25)] relative max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#7000ff]/20 border border-[#a855f7]/40 flex items-center justify-center text-[#a855f7] shadow-[0_0_15px_rgba(112,0,255,0.3)]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xl text-white uppercase tracking-wider">
                Arkadaşlık İsteği Gönder
              </h3>
              <p className="text-[11px] text-zinc-400">
                Oyuncu adını yazarak kayıtlı hesaplar arasında canlı arama yapın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form with Real-time Search */}
        <form onSubmit={handleSubmit} className="space-y-4 shrink-0">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#a4b0be] uppercase tracking-wider">
                Oyuncu Adı ile Ara veya Riot ID Gir
              </label>
              {riotIdInput && (
                <span className="text-[11px] text-[#a855f7] font-mono font-bold">
                  {filteredPlayers.length} oyuncu filtrelendi
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={riotIdInput}
                onChange={(e) => setRiotIdInput(e.target.value)}
                placeholder="Örn: Nickname veya Tag yazın (harf yazdıkça listelenir)..."
                autoFocus
                className="w-full pl-10 pr-24 py-2.5 bg-[#090d18] border border-white/15 focus:border-[#a855f7] rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all font-mono"
              />
              {riotIdInput && (
                <button
                  type="button"
                  onClick={() => setRiotIdInput('')}
                  className="absolute right-14 text-zinc-400 hover:text-white p-1 text-xs cursor-pointer"
                  title="Temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={!riotIdInput.trim()}
                className="absolute right-1.5 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-[0_2px_10px_rgba(112,0,255,0.4)] transition-all cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Gönder</span>
              </button>
            </div>
          </div>
        </form>

        {/* Live Filtered Results List */}
        <div className="mt-4 pt-3 border-t border-white/10 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {riotIdInput.trim()
                  ? `Filtrelenen Kayıtlı Oyuncular (${filteredPlayers.length})`
                  : `Platformdaki Kayıtlı Oyuncular (${availablePlayers.length})`}
              </span>
            </span>
            {riotIdInput.trim() && (
              <span className="text-[10px] text-zinc-500 font-mono">
                Canlı filtre aktif
              </span>
            )}
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[160px]">
            {filteredPlayers.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#090d18]/70 border border-white/5 text-center flex flex-col items-center justify-center">
                {riotIdInput.trim() ? (
                  <>
                    <ShieldAlert className="w-8 h-8 text-amber-400/70 mb-2" />
                    <p className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
                      "{riotIdInput}" ile eşleşen kayıtlı oyuncu bulunamadı
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                      Yalnızca sistem veritabanında kayıtlı gerçek oyunculara arkadaşlık isteği gönderilebilir. Lütfen ismi kontrol ediniz.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-400">
                    Şu an için istek gönderilebilecek başka kayıtlı oyuncu bulunmuyor.
                  </p>
                )}
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isExactMatch =
                  riotIdInput.trim().toLowerCase() === player.riotId.toLowerCase();

                return (
                  <div
                    key={player.riotId}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isExactMatch
                        ? 'bg-[#7000ff]/20 border-[#a855f7] shadow-[0_0_15px_rgba(112,0,255,0.3)]'
                        : 'bg-[#090d18] border-white/5 hover:border-white/20 hover:bg-[#141c2e]/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectName(player.riotId)}
                      className="text-left flex-1 min-w-0 pr-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="block font-bold text-xs sm:text-sm text-white group-hover:text-[#a855f7] transition-colors truncate">
                          {renderHighlightedText(player.riotId, riotIdInput.trim())}
                        </span>
                        <span className="text-[10px] text-[#ff4655] font-mono px-1.5 py-0.2 rounded bg-[#ff4655]/10 border border-[#ff4655]/20 shrink-0">
                          {player.rank || 'IMMORTAL'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block truncate mt-0.5">
                        {player.role || 'Flex Oyuncu'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectAndSend(player.riotId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7000ff]/20 hover:bg-[#7000ff] text-[#d8b4fe] hover:text-white border border-[#a855f7]/40 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-sm"
                    >
                      <Send className="w-3 h-3" />
                      <span>İstek Gönder</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
