import React, { useState } from 'react';
import { TeamRecruitment, UserAccount } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  MessageSquare,
  Clock,
  Plus,
  Trash2,
  X,
  Tag,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { ValorantListingDeployLoader } from './ValorantListingDeployLoader';
import { motion, AnimatePresence } from 'motion/react';

interface TeamsSectionProps {
  currentUser: UserAccount;
  teams: TeamRecruitment[];
  onCreateListing: (listing: TeamRecruitment) => void;
  onDeleteListing: (id: string) => void;
  onAddFriend: (riotId: string) => void;
  onStartChat: (riotId: string) => void;
  onRequireTrackerAuth: (context: 'scrim' | 'team' | 'coaching') => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TeamsSection: React.FC<TeamsSectionProps> = ({
  currentUser,
  teams,
  onCreateListing,
  onDeleteListing,
  onAddFriend,
  onStartChat,
  onRequireTrackerAuth,
  showToast,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'LFP' | 'LFM'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

  // Deploy animation state
  const [deployingListing, setDeployingListing] = useState<TeamRecruitment | null>(null);
  const [highlightedListingId, setHighlightedListingId] = useState<string | null>(null);

  // Form states
  const [listingType, setListingType] = useState<'LFP' | 'LFM'>('LFP');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('Main Duelist (Iso / Jett)');
  const [rank, setRank] = useState('Immortal 2');
  const [schedule, setSchedule] = useState('Hafta içi 20:00 - 23:30');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');

  const handleOpenCreateModal = () => {
    if (!currentUser.isTrackerVerified) {
      showToast('İlan verebilmek için Tracker.gg profilinizi doğrulamanız gerekmektedir.', 'info');
      onRequireTrackerAuth('team');
      return;
    }

    setContact(currentUser.riotId);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Lütfen ilan başlığını giriniz.', 'error');
      return;
    }

    const newListing: TeamRecruitment = {
      id: `team-listing-${Date.now()}`,
      type: listingType,
      title: title.trim(),
      authorRiotId: currentUser.riotId,
      authorTrackerUrl: currentUser.trackerUrl,
      isTrackerVerified: true,
      trackerStats: currentUser.trackerStats,
      isNewlyCreated: true,
      role: role.trim(),
      rank: rank.trim(),
      schedule: schedule.trim() || 'Esnek Saatler',
      description: description.trim() || 'Detaylar için mesaj atabilirsiniz.',
      contact: contact.trim() || currentUser.riotId,
      createdAt: 'Az önce',
    };

    // Close form and open Valorant Deploy Loading Screen
    setIsModalOpen(false);
    setDeployingListing(newListing);
    setTitle('');
    setDescription('');
    setContact('');
  };

  const handleDeployComplete = () => {
    if (!deployingListing) return;
    onCreateListing(deployingListing);
    setHighlightedListingId(deployingListing.id);
    showToast(
      deployingListing.type === 'LFP'
        ? 'Takım arama ilanınız (LFP) Valorant protokolüyle yayınlandı!'
        : 'Oyuncu arama ilanınız (LFM) Valorant protokolüyle yayınlandı!'
    );
    setDeployingListing(null);

    // Clear highlight after 5 seconds
    setTimeout(() => {
      setHighlightedListingId(null);
    }, 5000);
  };

  const confirmDelete = () => {
    if (deletingListingId) {
      onDeleteListing(deletingListingId);
      setDeletingListingId(null);
    }
  };

  const filteredTeams = teams.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-[#0e1424]/85 border border-[#ff4655]/25 p-6 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00b894] font-rajdhani font-bold text-xs uppercase tracking-widest mb-1">
            <Users className="w-4 h-4" />
            <span>TOPLULUK TRANSFER & KADRO MERKEZİ</span>
          </div>
          <h2 className="font-rajdhani font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            Takım & Oyuncu İlanları
          </h2>
          <p className="text-[#a4b0be] text-xs sm:text-sm mt-1 max-w-xl">
            Sadece gerçek oyuncuların oluşturduğu ilanlar: Kendinizi takım arayan oyuncu (LFP) olarak ilan edebilir veya takımınız için oyuncu (LFM) arayabilirsiniz.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00b894] to-[#009475] hover:brightness-110 text-white font-rajdhani font-bold text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(0,184,148,0.4)] transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yeni İlan Oluştur</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-[#0a0f1b]/70 p-2.5 rounded-xl border border-white/10 w-fit">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
            filterType === 'ALL'
              ? 'bg-[#ff4655] text-white shadow-[0_0_10px_rgba(255,70,85,0.4)]'
              : 'text-[#a4b0be] hover:text-white hover:bg-white/5'
          }`}
        >
          Tüm İlanlar ({teams.length})
        </button>
        <button
          onClick={() => setFilterType('LFP')}
          className={`px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
            filterType === 'LFP'
              ? 'bg-[#00b894] text-white shadow-[0_0_10px_rgba(0,184,148,0.4)]'
              : 'text-[#a4b0be] hover:text-white hover:bg-white/5'
          }`}
        >
          Takım Arayan Oyuncular (LFP)
        </button>
        <button
          onClick={() => setFilterType('LFM')}
          className={`px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
            filterType === 'LFM'
              ? 'bg-[#7000ff] text-white shadow-[0_0_10px_rgba(112,0,255,0.4)]'
              : 'text-[#a4b0be] hover:text-white hover:bg-white/5'
          }`}
        >
          Oyuncu Arayan Takımlar (LFM)
        </button>
      </div>

      {/* Grid of Listings */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/15 bg-[#0e1424]/40 p-6">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wide">
            Henüz Aktif Oyuncu veya Takım İlanı Yok
          </h3>
          <p className="text-[#a4b0be] text-xs max-w-md mx-auto mt-1 mb-5">
            Bu alanda bot veya sahte ilanlar bulunmaz. İlk ilanı siz vererek bir takıma katılabilir veya ekibinizi toplayabilirsiniz!
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b894] to-[#009475] text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(0,184,148,0.4)] cursor-pointer"
          >
            İlk İlanı Sen Ver
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTeams.map((item) => {
              const isMine = item.authorRiotId.toLowerCase() === currentUser.riotId.toLowerCase();
              const isHighlight = item.id === highlightedListingId || item.isNewlyCreated;

              const trackerProfileUrl =
                item.authorTrackerUrl ||
                `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(
                  item.authorRiotId.replace('#', '%23')
                )}/overview`;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -25, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                  className={`group relative rounded-xl bg-[#0e1424]/85 border p-5 backdrop-blur-md transition-all shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between ${
                    isHighlight
                      ? 'border-[#00b894] ring-2 ring-[#00b894]/60 shadow-[0_0_30px_rgba(0,184,148,0.45)]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* Newly Created Badge */}
                  {isHighlight && (
                    <div className="absolute -top-2.5 right-4 z-10 px-2.5 py-0.5 rounded-full bg-[#00b894] text-white text-[10px] font-mono font-black uppercase tracking-wider shadow-[0_0_12px_#00b894] flex items-center gap-1 animate-bounce">
                      <Sparkles className="w-3 h-3" />
                      <span>YENİ DÜŞTÜ</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-rajdhani font-black uppercase tracking-wider mb-1.5 border ${
                            item.type === 'LFP'
                              ? 'bg-[#00b894]/20 text-[#00b894] border-[#00b894]/40'
                              : 'bg-[#7000ff]/20 text-[#d8b4fe] border-[#a855f7]/40'
                          }`}
                        >
                          {item.type === 'LFP' ? 'OYUNCU (LFP)' : 'TAKIM KADROSU (LFM)'}
                        </span>
                        <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wide leading-snug">
                          {item.title}
                        </h3>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <span className="text-[11px] text-[#a4b0be]">
                            Yayınlayan: <strong className="text-white">{item.authorRiotId}</strong>
                          </span>

                          {/* Tracker Verification Badge */}
                          <a
                            href={trackerProfileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-[#00b894] hover:text-[#55efc4] bg-[#00b894]/15 hover:bg-[#00b894]/25 px-1.5 py-0.5 rounded border border-[#00b894]/30 transition-all w-fit mt-0.5"
                            title="Tracker.gg Profilini Doğrulanmış Olarak İncele"
                          >
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                            <span>Tracker Doğrulandı ✓</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                          </a>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[11px] font-rajdhani font-bold uppercase tracking-wider bg-white/5 text-amber-400 border border-amber-500/30 shrink-0">
                        {item.rank}
                      </span>
                    </div>

                    {/* Stats pill if available */}
                    {item.trackerStats && (
                      <div className="my-2.5 p-2 rounded-lg bg-black/40 border border-white/5 grid grid-cols-3 gap-1 text-center font-mono text-[11px]">
                        <div>
                          <span className="text-[9px] text-zinc-500 block">K/D</span>
                          <span className="font-bold text-white">{item.trackerStats.kd}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block">KAZANMA</span>
                          <span className="font-bold text-[#00b894]">{item.trackerStats.winRate}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block">HEADSHOT</span>
                          <span className="font-bold text-[#f59e0b]">{item.trackerStats.headshot}</span>
                        </div>
                      </div>
                    )}

                    <div className="my-3 space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#090d18]/70 border border-white/5">
                        <span className="text-[10px] font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider block mb-0.5">
                          Rol & Pozisyon
                        </span>
                        <p className="font-bold text-white text-sm">{item.role}</p>
                      </div>

                      <p className="text-zinc-300 leading-relaxed text-xs">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] pt-1">
                        <Clock className="w-3.5 h-3.5 text-[#a855f7]" />
                        <span>{item.schedule}</span>
                      </div>

                      <div className="text-[11px] text-zinc-400">
                        İletişim: <span className="text-white font-mono">{item.contact}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    {isMine ? (
                      <button
                        onClick={() => setDeletingListingId(item.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/30 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>İlanımı Sil</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onAddFriend(item.authorRiotId)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#141c2e] hover:bg-[#7000ff] border border-white/10 hover:border-[#a855f7] text-white text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                          title="Arkadaşlık İsteği Gönder"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>İstek Gönder</span>
                        </button>

                        <button
                          onClick={() => onStartChat(item.authorRiotId)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#141c2e] hover:bg-[#ff4655] border border-white/10 hover:border-[#ff4655] text-white text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Mesaj At</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Valorant Deployment Loading Screen */}
      <ValorantListingDeployLoader
        isOpen={!!deployingListing}
        listingType="team"
        title={deployingListing?.title || ''}
        authorRiotId={currentUser.riotId}
        rank={deployingListing?.rank || 'IMMORTAL'}
        trackerUrl={currentUser.trackerUrl}
        onComplete={handleDeployComplete}
      />

      {/* MODAL: Yeni İlan Oluştur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d1424] border border-[#00b894]/40 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#00b894]" />
                <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider">
                  Yeni Oyuncu / Takım İlanı
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1.5">
                  İlan Türü
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setListingType('LFP')}
                    className={`py-2 px-3 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      listingType === 'LFP'
                        ? 'bg-[#00b894] text-white border-[#00b894]'
                        : 'bg-[#090d18] text-zinc-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    Takım Arıyorum (LFP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType('LFM')}
                    className={`py-2 px-3 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      listingType === 'LFM'
                        ? 'bg-[#7000ff] text-white border-[#7000ff]'
                        : 'bg-[#090d18] text-zinc-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    Oyuncu Arıyoruz (LFM)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  İlan Başlığı
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    listingType === 'LFP'
                      ? 'Örn: Immortal 2 Iso/Jett Main Turnuva Takımı Arıyor'
                      : 'Örn: Challengers Elemeleri İçin Duelist / Initiator Arıyoruz'
                  }
                  required
                  className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#00b894] rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                    Rol / Ajanlar
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Duelist (Iso, Jett)"
                    required
                    className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#00b894] rounded-lg text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                    Rank Seviyesi
                  </label>
                  <input
                    type="text"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="Immortal 2 / 240 RR"
                    required
                    className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#00b894] rounded-lg text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  Müsaitlik / Scrim & Antrenman Saatleri
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Hafta içi her gün 20:00 - 23:30"
                  className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#00b894] rounded-lg text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  Açıklama & Hedefleriniz
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Oyun tarzınız, önceki takım deneyimleriniz veya beklentileriniz..."
                  className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#00b894] rounded-lg text-sm text-white placeholder-zinc-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  İletişim Bilgisi (Riot ID / Discord)
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="discord: player#0001 veya Riot ID"
                  required
                  className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#00b894] rounded-lg text-sm text-white outline-none"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#a4b0be] hover:text-white text-xs font-rajdhani font-bold uppercase tracking-wider"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00b894] to-[#009475] text-white text-xs font-rajdhani font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(0,184,148,0.4)] cursor-pointer"
                >
                  İlanı Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Team Listing Confirmation Dialog */}
      <ConfirmModal
        isOpen={deletingListingId !== null}
        title="İlanı Silmek İstediğinize Emin Misiniz?"
        description="Bu ilan silindiğinde transfer merkezinden tamamen kaldırılacaktır. Bu işlem geri alınamaz."
        confirmText="Evet, İlanı Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingListingId(null)}
      />
    </div>
  );
};
