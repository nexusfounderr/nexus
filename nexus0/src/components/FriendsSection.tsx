import React, { useState } from 'react';
import { FriendItem, FriendRequest, UserAccount } from '../types';
import { UserPlus, UserCheck, MessageSquare, Trash2, Search, Users, Shield, Circle, Clock, Check, X, Send } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface FriendsSectionProps {
  currentUser: UserAccount;
  friends: FriendItem[];
  friendRequests: FriendRequest[];
  onSendRequest: (riotId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onCancelRequest: (requestId: string) => void;
  onRemoveFriend: (riotId: string) => void;
  onStartChat: (friendRiotId: string) => void;
  registeredUsers: UserAccount[];
}

export const FriendsSection: React.FC<FriendsSectionProps> = ({
  currentUser,
  friends,
  friendRequests,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveFriend,
  onStartChat,
  registeredUsers,
}) => {
  const [subTab, setSubTab] = useState<'friends' | 'incoming' | 'outgoing'>('friends');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);

  const incomingRequests = friendRequests.filter(
    (r) => r.toRiotId.toLowerCase() === currentUser.riotId.toLowerCase() && r.status === 'pending'
  );

  const outgoingRequests = friendRequests.filter(
    (r) => r.fromRiotId.toLowerCase() === currentUser.riotId.toLowerCase() && r.status === 'pending'
  );

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendInput.trim()) return;
    onSendRequest(newFriendInput.trim());
    setNewFriendInput('');
    setShowLiveDropdown(false);
  };

  const filteredFriends = friends.filter((f) =>
    f.riotId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Other real registered players on the platform who are not current user, not friends, and have no pending requests
  const otherRegisteredPlayers = registeredUsers.filter((u) => {
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

  // Automatically filter registered players as letters are typed
  const filteredOtherPlayers = otherRegisteredPlayers.filter((player) => {
    const query = newFriendInput.trim().toLowerCase();
    if (!query) return true;
    return (
      player.riotId.toLowerCase().includes(query) ||
      (player.role && player.role.toLowerCase().includes(query)) ||
      (player.rank && player.rank.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-[#0e1424]/85 border border-[#7000ff]/30 p-6 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#a855f7] font-rajdhani font-bold text-xs uppercase tracking-widest mb-1">
            <Users className="w-4 h-4" />
            <span>ONAYLI ARKADAŞLIK & İSTEK SİSTEMİ</span>
          </div>
          <h2 className="font-rajdhani font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            Arkadaş Listeniz & İstekler
          </h2>
          <p className="text-[#a4b0be] text-xs sm:text-sm mt-1 max-w-xl">
            Oyuncular doğrudan listeye eklenmez; önce arkadaşlık isteği gönderilir. Karşı taraf kabul ettiğinde arkadaş olursunuz ve özel sohbet açılır.
          </p>
        </div>

        {/* Quick Send Request Form with Live Filter Dropdown */}
        <div className="relative w-full md:w-auto">
          <form onSubmit={handleSendSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <input
                type="text"
                value={newFriendInput}
                onChange={(e) => {
                  setNewFriendInput(e.target.value);
                  setShowLiveDropdown(true);
                }}
                onFocus={() => setShowLiveDropdown(true)}
                placeholder="Riot ID ile ara (harf yazdıkça listelenir)..."
                className="w-full px-3.5 py-2.5 bg-[#090d18] border border-white/15 focus:border-[#a855f7] rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-all font-mono"
              />
              {newFriendInput && (
                <button
                  type="button"
                  onClick={() => {
                    setNewFriendInput('');
                    setShowLiveDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!newFriendInput.trim()}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(112,0,255,0.4)] transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>İstek Gönder</span>
            </button>
          </form>

          {/* Real-time floating autocomplete dropdown when typing */}
          {showLiveDropdown && newFriendInput.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#0d1424] border border-[#a855f7]/50 rounded-xl p-2 shadow-[0_15px_40px_rgba(0,0,0,0.9)] max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-zinc-400 border-b border-white/10 mb-1">
                <span>CANLI FİLTRELENEN OYUNCULAR</span>
                <span className="text-[#a855f7] font-mono">{filteredOtherPlayers.length} Sonuç</span>
              </div>
              {filteredOtherPlayers.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-500 font-sans">
                  "{newFriendInput}" ile eşleşen kayıtlı oyuncu bulunamadı.
                </div>
              ) : (
                filteredOtherPlayers.slice(0, 6).map((player) => (
                  <div
                    key={player.riotId}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => setNewFriendInput(player.riotId)}
                  >
                    <div>
                      <span className="font-bold text-xs text-white group-hover:text-[#a855f7] transition-colors block">
                        {player.riotId}
                      </span>
                      <span className="text-[10px] text-[#ff4655] font-mono">
                        {player.rank || 'IMMORTAL'} • {player.role || 'Flex'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendRequest(player.riotId);
                        setNewFriendInput('');
                        setShowLiveDropdown(false);
                      }}
                      className="px-2.5 py-1 rounded bg-[#7000ff]/20 hover:bg-[#7000ff] text-[#d8b4fe] hover:text-white text-[11px] font-bold uppercase transition-colors"
                    >
                      Gönder
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs: Friends / Incoming Requests / Outgoing Requests */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setSubTab('friends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-rajdhani font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${
            subTab === 'friends'
              ? 'bg-[#00b894] text-white shadow-[0_0_15px_rgba(0,184,148,0.4)]'
              : 'bg-[#0e1424] text-zinc-400 hover:text-white border border-white/5'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Ekli Arkadaşlarım ({friends.length})</span>
        </button>

        <button
          onClick={() => setSubTab('incoming')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-rajdhani font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${
            subTab === 'incoming'
              ? 'bg-[#ff4655] text-white shadow-[0_0_15px_rgba(255,70,85,0.4)]'
              : 'bg-[#0e1424] text-zinc-400 hover:text-white border border-white/5'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Gelen İstekler</span>
          {incomingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-[#ff4655] animate-pulse">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('outgoing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-rajdhani font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${
            subTab === 'outgoing'
              ? 'bg-[#7000ff] text-white shadow-[0_0_15px_rgba(112,0,255,0.4)]'
              : 'bg-[#0e1424] text-zinc-400 hover:text-white border border-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Gönderilen İstekler ({outgoingRequests.length})</span>
        </button>
      </div>

      {/* 1. INCOMING REQUESTS VIEW */}
      {subTab === 'incoming' && (
        <div className="space-y-4">
          <div className="bg-[#0a0f1b]/70 p-4 rounded-xl border border-[#ff4655]/20 flex items-center justify-between">
            <h3 className="font-rajdhani font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#ff4655]" />
              <span>Size Gelen Arkadaşlık İstekleri</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">{incomingRequests.length} Bekleyen İstek</span>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#0e1424]/60 border border-white/5 text-zinc-500 text-sm">
              Şu an size gelen bekleyen arkadaşlık isteği bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#0e1424]/90 border border-[#ff4655]/30 shadow-lg flex items-center justify-between gap-3 hover:border-[#ff4655]/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/40 flex items-center justify-center text-[#ff4655] font-rajdhani font-black text-sm">
                      {req.fromRiotId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-rajdhani font-bold text-sm text-white">
                          {req.fromRiotId}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ff4655]/20 text-[#ff4655] border border-[#ff4655]/30">
                          {req.fromRank || 'IMMORTAL'}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-500" /> {req.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Accept / Decline Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAcceptRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00b894] to-[#00cec9] hover:brightness-110 text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(0,184,148,0.4)] transition-all cursor-pointer"
                      title="İsteği Kabul Et"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Kabul Et</span>
                    </button>
                    <button
                      onClick={() => onDeclineRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/30 font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                      title="İsteği Reddet"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reddet</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. OUTGOING REQUESTS VIEW */}
      {subTab === 'outgoing' && (
        <div className="space-y-4">
          <div className="bg-[#0a0f1b]/70 p-4 rounded-xl border border-[#7000ff]/20 flex items-center justify-between">
            <h3 className="font-rajdhani font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#a855f7]" />
              <span>Gönderdiğiniz Bekleyen İstekler</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">{outgoingRequests.length} İstek</span>
          </div>

          {outgoingRequests.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#0e1424]/60 border border-white/5 text-zinc-500 text-sm">
              Bekleyen giden arkadaşlık isteğiniz yok.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {outgoingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#0e1424]/90 border border-white/10 shadow-lg flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7000ff]/15 border border-[#a855f7]/40 flex items-center justify-center text-[#a855f7] font-rajdhani font-black text-sm">
                      {req.toRiotId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-rajdhani font-bold text-sm text-white block">
                        {req.toRiotId}
                      </span>
                      <span className="text-[11px] text-amber-400/80 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Karşı tarafın onayı bekleniyor
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onCancelRequest(req.id)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    İptal Et
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. ACCEPTED FRIENDS LIST VIEW */}
      {subTab === 'friends' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0f1b]/70 p-3 rounded-xl border border-white/10">
            <span className="font-rajdhani font-bold text-sm text-white uppercase tracking-wider">
              Ekli Arkadaşlarım ({friends.length})
            </span>

            {friends.length > 0 && (
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Arkadaş ara..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#090d18] border border-white/10 focus:border-[#00b894] rounded-lg text-xs text-white placeholder-zinc-500 outline-none"
                />
              </div>
            )}
          </div>

          {filteredFriends.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#0e1424]/60 border border-white/5">
              <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm font-rajdhani font-bold uppercase tracking-wider">
                {searchTerm ? 'Aramanıza uygun arkadaş bulunamadı.' : 'Henüz arkadaş listenizde kimse yok.'}
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Yukarıdaki kutudan bir Riot ID yazarak veya aşağıdaki listeden istek göndererek arkadaş ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.riotId}
                  className="group p-4 rounded-2xl bg-[#0e1424]/90 border border-white/10 hover:border-[#00b894]/50 transition-all shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00b894] to-[#0984e3] p-0.5 flex items-center justify-center font-rajdhani font-black text-sm text-white">
                          <div className="w-full h-full bg-[#0a0f1b] rounded-[10px] flex items-center justify-center">
                            {friend.riotId.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0e1424] ${
                            friend.status === 'online'
                              ? 'bg-[#00b894]'
                              : friend.status === 'in-game'
                              ? 'bg-[#fdcb6e]'
                              : 'bg-zinc-600'
                          }`}
                          title={friend.status}
                        />
                      </div>
                      <div>
                        <h4 className="font-rajdhani font-bold text-sm text-white group-hover:text-[#00b894] transition-colors">
                          {friend.riotId}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-[#ff4655] bg-[#ff4655]/10 px-1.5 py-0.2 rounded border border-[#ff4655]/30">
                            {friend.rank}
                          </span>
                          <span className="text-[10px] text-zinc-400">{friend.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onStartChat(friend.riotId)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#00b894]/20 hover:bg-[#00b894] text-[#00b894] hover:text-white border border-[#00b894]/40 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Sohbet Et (DM)</span>
                    </button>

                    <button
                      onClick={() => setFriendToRemove(friend.riotId)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-[#ff4655]/20 text-zinc-400 hover:text-[#ff4655] border border-white/5 hover:border-[#ff4655]/40 transition-all cursor-pointer"
                      title="Arkadaşlıktan Çıkar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggested / Other Registered Arena Players to Send Requests to */}
      {otherRegisteredPlayers.length > 0 && (
        <div className="rounded-2xl bg-[#0a0f1b]/70 border border-white/10 p-5 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="font-rajdhani font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#a855f7]" />
                <span>Platforma Kayıtlı Diğer Gerçek Oyuncular</span>
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                {newFriendInput.trim()
                  ? `"${newFriendInput}" aramasına göre gerçek zamanlı filtreleniyor`
                  : 'Nexus sistemine kayıt olmuş oyunculara buradan doğrudan arkadaşlık isteği yollayabilirsiniz.'}
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#a855f7] bg-[#7000ff]/20 px-2.5 py-1 rounded border border-[#a855f7]/30 self-start sm:self-auto">
              {filteredOtherPlayers.length} / {otherRegisteredPlayers.length} Oyuncu
            </span>
          </div>

          {filteredOtherPlayers.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#0e1424]/60 border border-white/5 text-center">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                "{newFriendInput}" ile eşleşen kayıtlı oyuncu bulunamadı.
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Lütfen aramak istediğiniz Riot ID harflerini kontrol ediniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredOtherPlayers.map((player) => (
                <div
                  key={player.riotId}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0e1424] border border-white/5 hover:border-white/15 transition-all"
                >
                  <div>
                    <span className="font-rajdhani font-bold text-xs text-white block">
                      {player.riotId}
                    </span>
                    <span className="text-[10px] text-[#ff4655] font-mono">
                      {player.rank || 'IMMORTAL'} • {player.role || 'Flex'}
                    </span>
                  </div>

                  <button
                    onClick={() => onSendRequest(player.riotId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(112,0,255,0.4)] transition-all cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>İstek Gönder</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remove Friend Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(friendToRemove)}
        title="Arkadaşlıktan Çıkarmak İstediğinize Emin Misiniz?"
        description={`"${friendToRemove}" arkadaş listenizden çıkarılacaktır.`}
        confirmText="Evet, Çıkar"
        cancelText="Vazgeç"
        isDanger={true}
        onConfirm={() => {
          if (friendToRemove) {
            onRemoveFriend(friendToRemove);
            setFriendToRemove(null);
          }
        }}
        onCancel={() => setFriendToRemove(null)}
      />
    </div>
  );
};
