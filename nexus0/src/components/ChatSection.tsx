import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FriendItem, UserAccount } from '../types';
import { Send, MessageSquare, Users, Lock, Shield, Circle, UserPlus, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface ChatSectionProps {
  currentUser: UserAccount;
  friends: FriendItem[];
  messages: ChatMessage[];
  onSendMessage: (receiverRiotId: string, text: string) => void;
  activeDmTarget: string | null;
  onSelectDmTarget: (riotId: string | null) => void;
  onNavigateToFriends?: () => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  currentUser,
  friends,
  messages,
  onSendMessage,
  activeDmTarget,
  onSelectDmTarget,
  onNavigateToFriends,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active friend check: Chat is strictly isolated to mutual accepted friends only
  const activeFriend =
    friends.find((f) => f.riotId.toLowerCase() === activeDmTarget?.toLowerCase()) ||
    (friends.length > 0 ? friends[0] : null);

  const activeFriendRiotId = activeFriend ? activeFriend.riotId : null;

  // Filter messages exclusively for current user and active mutual friend
  const filteredMessages = messages.filter((m) => {
    if (!activeFriendRiotId) return false;
    const isSentByMeToFriend =
      m.senderRiotId.toLowerCase() === currentUser.riotId.toLowerCase() &&
      m.receiverRiotId.toLowerCase() === activeFriendRiotId.toLowerCase();
    const isSentByFriendToMe =
      m.senderRiotId.toLowerCase() === activeFriendRiotId.toLowerCase() &&
      m.receiverRiotId.toLowerCase() === currentUser.riotId.toLowerCase();
    return isSentByMeToFriend || isSentByFriendToMe;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const prevMessagesCountRef = useRef(filteredMessages.length);

  useEffect(() => {
    scrollToBottom();
    // Play sound when a new message arrives from the chat partner
    if (filteredMessages.length > prevMessagesCountRef.current) {
      const latestMsg = filteredMessages[filteredMessages.length - 1];
      if (latestMsg && latestMsg.senderRiotId.toLowerCase() !== currentUser.riotId.toLowerCase()) {
        soundManager.playMessageSound();
      }
    }
    prevMessagesCountRef.current = filteredMessages.length;
  }, [filteredMessages.length, activeFriendRiotId, currentUser.riotId, filteredMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeFriendRiotId) return;
    onSendMessage(activeFriendRiotId, inputText.trim());
    setInputText('');
  };

  // If user has NO friends yet, show dedicated friend-isolated security state
  if (friends.length === 0) {
    return (
      <div className="h-[calc(100vh-140px)] min-h-[500px] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-[#0e1424]/90 border border-[#7000ff]/40 p-8 text-center backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(112,0,255,0.2)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7000ff] via-[#a855f7] to-[#7000ff]" />

          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#7000ff]/20 border border-[#a855f7]/40 flex items-center justify-center text-[#a855f7] mb-5 shadow-[0_0_20px_rgba(112,0,255,0.3)]">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-rajdhani font-black text-[#a855f7] uppercase tracking-widest bg-[#7000ff]/15 px-3 py-1 rounded-full border border-[#a855f7]/30">
            Güvenlik Protokolü • İzole Sohbet
          </span>

          <h3 className="font-rajdhani font-black text-2xl text-white uppercase tracking-wider mt-3 mb-2">
            Arkadaş Bazlı Özel Sohbet
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-rajdhani text-sm">
            Platform içi sohbet sistemi tamamen izole ve güvenli tutulmaktadır. Mesajlaşma yalnızca karşılıklı olarak arkadaşlık isteği kabul edilmiş gerçek platform oyuncuları arasında aktifleşir.
          </p>

          {onNavigateToFriends && (
            <button
              onClick={onNavigateToFriends}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(112,0,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Arkadaş Ekle / İstekleri Yönet</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] min-h-[550px] flex flex-col md:flex-row gap-4 font-rajdhani">
      {/* Sidebar: Mutually Accepted Friends List */}
      <div className="w-full md:w-80 shrink-0 rounded-2xl bg-[#0e1424]/90 border border-white/10 p-4 flex flex-col backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#ff4655]" />
            <h3 className="font-black text-base text-white uppercase tracking-wider">
              Arkadaş Sohbetleri
            </h3>
          </div>
          <span className="text-[10px] text-[#a855f7] bg-[#7000ff]/20 px-2 py-0.5 rounded font-mono font-bold border border-[#a855f7]/30">
            {friends.length} Onaylı Arkadaş
          </span>
        </div>

        {/* Friends selection stream */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {friends.map((friend) => {
            const isSelected = activeFriendRiotId?.toLowerCase() === friend.riotId.toLowerCase();
            return (
              <button
                key={friend.riotId}
                onClick={() => onSelectDmTarget(friend.riotId)}
                className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#7000ff]/30 to-[#a855f7]/20 border border-[#a855f7] text-white shadow-[0_0_15px_rgba(112,0,255,0.25)]'
                    : 'bg-[#141c2e]/60 hover:bg-white/5 text-zinc-300 border border-white/5'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#141c2e] to-[#090d18] border border-white/10 flex items-center justify-center font-black text-xs text-white">
                    {friend.riotId.substring(0, 2).toUpperCase()}
                  </div>
                  <Circle
                    className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-current ${
                      friend.status === 'online'
                        ? 'text-[#00b894]'
                        : friend.status === 'in-game'
                        ? 'text-amber-400'
                        : 'text-zinc-500'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate">
                      {friend.riotId}
                    </span>
                    <span className="text-[9px] text-[#ff4655] font-mono px-1 py-0.2 rounded bg-[#ff4655]/10 border border-[#ff4655]/20">
                      {friend.rank}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate block">
                    {friend.role}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {onNavigateToFriends && (
          <div className="pt-3 border-t border-white/10 mt-2">
            <button
              onClick={onNavigateToFriends}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#a855f7]" />
              <span>Yeni Arkadaş Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Conversation Area */}
      <div className="flex-1 rounded-2xl bg-[#0e1424]/90 border border-white/10 flex flex-col backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] overflow-hidden">
        {activeFriend ? (
          <>
            {/* Header with active friend info */}
            <div className="p-4 border-b border-white/10 bg-[#0a0f1b]/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7000ff] to-[#a855f7] p-0.5 shadow-[0_0_15px_rgba(112,0,255,0.3)]">
                    <div className="w-full h-full bg-[#0a0f1b] rounded-[10px] flex items-center justify-center font-black text-sm text-white">
                      {activeFriend.riotId.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <Circle
                    className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 fill-current border-2 border-[#0a0f1b] ${
                      activeFriend.status === 'online'
                        ? 'text-[#00b894]'
                        : activeFriend.status === 'in-game'
                        ? 'text-amber-400'
                        : 'text-zinc-500'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base text-white tracking-wide uppercase">
                      {activeFriend.riotId}
                    </h4>
                    <span className="text-[10px] text-[#ff4655] font-mono px-1.5 py-0.2 rounded bg-[#ff4655]/10 border border-[#ff4655]/30">
                      {activeFriend.rank}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span>{activeFriend.role}</span>
                    <span>•</span>
                    <span className="text-[#00b894] font-medium">Karşılıklı Onaylı Arkadaş</span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#7000ff]/15 border border-[#a855f7]/30 text-[#a855f7] text-[11px] font-bold">
                <Lock className="w-3 h-3" />
                <span>Uçtan Uca İzole Sohbet</span>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-3">
                    <MessageSquare className="w-6 h-6 opacity-60" />
                  </div>
                  <p className="font-bold text-sm text-zinc-300 uppercase tracking-wider">
                    {activeFriend.riotId} ile henüz bir mesajınız yok
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                    Mesaj göndererek gerçek zamanlı arkadaş sohbetini başlatabilirsiniz. Tüm mesajlaşmalar yalnızca ikiniz arasındadır.
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMine = msg.senderRiotId.toLowerCase() === currentUser.riotId.toLowerCase();
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="font-bold text-xs text-zinc-400">
                          {isMine ? 'Siz' : msg.senderRiotId}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                          isMine
                            ? 'bg-gradient-to-r from-[#ff4655] to-[#c92a38] text-white rounded-tr-none font-medium'
                            : 'bg-[#141c2e] text-zinc-100 border border-white/10 rounded-tl-none font-medium'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box: Single clean intuitive action */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#0a0f1b]/80 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`${activeFriend.riotId} için mesajınızı yazın...`}
                className="flex-1 px-4 py-2.5 bg-[#090d18] border border-white/15 focus:border-[#a855f7] rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(112,0,255,0.4)] flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gönder</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-zinc-500">
            Lütfen sohbet etmek için sol menüden bir arkadaşınızı seçin.
          </div>
        )}
      </div>
    </div>
  );
};
