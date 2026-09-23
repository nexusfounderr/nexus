import React, { useState } from 'react';
import { ScrimItem, UserAccount } from '../types';
import {
  Swords,
  Plus,
  Calendar,
  MapPin,
  Search,
  Trash2,
  MessageSquare,
  UserPlus,
  X,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { ValorantListingDeployLoader } from './ValorantListingDeployLoader';
import { motion, AnimatePresence } from 'motion/react';

interface ScrimSectionProps {
  currentUser: UserAccount;
  scrims: ScrimItem[];
  onCreateScrim: (newScrim: ScrimItem) => void;
  onDeleteScrim: (id: string) => void;
  onAddFriend: (riotId: string) => void;
  onStartChat: (riotId: string) => void;
  onRequireTrackerAuth: (context: 'scrim' | 'team' | 'coaching') => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const VALORANT_MAPS = ['Ascent', 'Haven', 'Bind', 'Sunset', 'Abyss', 'Lotus', 'Split', 'Icebox'];

export const ScrimSection: React.FC<ScrimSectionProps> = ({
  currentUser,
  scrims,
  onCreateScrim,
  onDeleteScrim,
  onAddFriend,
  onStartChat,
  onRequireTrackerAuth,
  showToast,
}) => {
  const [filterRank, setFilterRank] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joinedScrimIds, setJoinedScrimIds] = useState<string[]>([]);
  const [deletingScrimId, setDeletingScrimId] = useState<string | null>(null);

  // Deploy animation state
  const [deployingScrim, setDeployingScrim] = useState<ScrimItem | null>(null);
  const [highlightedScrimId, setHighlightedScrimId] = useState<string | null>(null);

  // Modal Form State
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [rank, setRank] = useState<'Ascendant' | 'Immortal' | 'Radiant' | 'Diamond' | 'Platinum'>('Immortal');
  const [time, setTime] = useState('Bugün 21:00');
  const [format, setFormat] = useState<'Bo1' | 'Bo3' | 'Bo5'>('Bo3');
  const [selectedMaps, setSelectedMaps] = useState<string[]>(['Ascent', 'Haven']);
  const [contact, setContact] = useState('');

  const toggleMapSelection = (mapName: string) => {
    if (selectedMaps.includes(mapName)) {
      if (selectedMaps.length > 1) {
        setSelectedMaps(selectedMaps.filter((m) => m !== mapName));
      }
    } else {
      setSelectedMaps([...selectedMaps, mapName]);
    }
  };

  const handleOpenCreateModal = () => {
    // REQUIRE TRACKER VERIFICATION & LOGIN
    if (!currentUser.isTrackerVerified) {
      showToast('İlan verebilmek için Tracker.gg profilinizi doğrulamanız gerekmektedir.', 'info');
      onRequireTrackerAuth('scrim');
      return;
    }

    setContact(currentUser.riotId);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      showToast('Lütfen takım adını giriniz.', 'error');
      return;
    }

    const newScrim: ScrimItem = {
      id: `scrim-${Date.now()}`,
      teamName: teamName.trim(),
      tag: teamTag.trim() || teamName.slice(0, 3).toUpperCase(),
      rank,
      time: time.trim() || 'Bugün 21:00',
      format,
      maps: selectedMaps,
      slotsAvailable: 1,
      hostName: currentUser.riotId,
      authorRiotId: currentUser.riotId,
      authorTrackerUrl: currentUser.trackerUrl,
      isTrackerVerified: true,
      isNewlyCreated: true,
      contact: contact.trim() || currentUser.riotId,
      createdAt: 'Az önce',
    };

    // Close form and open Valorant Deploy Loading Screen
    setIsModalOpen(false);
    setDeployingScrim(newScrim);
    setTeamName('');
    setTeamTag('');
    setContact('');
  };

  const handleDeployComplete = () => {
    if (!deployingScrim) return;
    onCreateScrim(deployingScrim);
    setHighlightedScrimId(deployingScrim.id);
    showToast(`"${deployingScrim.teamName}" için yeni scrim ilanı arenada yayınlandı!`);
    setDeployingScrim(null);

    // Clear highlight after 5 seconds
    setTimeout(() => {
      setHighlightedScrimId(null);
    }, 5000);
  };

  const handleJoinScrim = (scrim: ScrimItem) => {
    if (joinedScrimIds.includes(scrim.id)) {
      showToast(`${scrim.teamName} takımına zaten istek gönderdiniz.`, 'info');
      return;
    }
    setJoinedScrimIds([...joinedScrimIds, scrim.id]);
    showToast(`${scrim.teamName} [${scrim.tag}] takımına scrim maç isteğiniz iletildi!`);
  };

  const confirmDelete = () => {
    if (deletingScrimId) {
      onDeleteScrim(deletingScrimId);
      setDeletingScrimId(null);
    }
  };

  const filteredScrims = scrims.filter((s) => {
    const matchesRank = filterRank === 'ALL' || s.rank === filterRank;
    const matchesSearch =
      s.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.maps.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRank && matchesSearch;
  });

  const getRankBadgeColor = (rankStr: string) => {
    switch (rankStr) {
      case 'Radiant':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Immortal':
        return 'bg-[#7000ff]/25 text-[#d8b4fe] border-[#a855f7]/50';
      case 'Ascendant':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-[#0e1424]/85 border border-[#ff4655]/25 p-6 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#ff4655] font-rajdhani font-bold text-xs uppercase tracking-widest mb-1">
            <Swords className="w-4 h-4" />
            <span>TOPLULUK REKABETÇİ PRATİK MERKEZİ</span>
          </div>
          <h2 className="font-rajdhani font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            Scrim Lobisi & Eşleşmeler
          </h2>
          <p className="text-[#a4b0be] text-xs sm:text-sm mt-1 max-w-xl">
            Sadece gerçek takımların ve oyuncuların açtığı maç ilanları: Antrenman maçı ayarlayın veya açık scrimlere katılın.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#ff4655] to-[#c92a38] hover:from-[#ff5e6c] hover:to-[#db3241] text-white font-rajdhani font-bold text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(255,70,85,0.4)] transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yeni Scrim Kur</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0a0f1b]/70 p-3 rounded-xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'Radiant', 'Immortal', 'Ascendant'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRank(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                filterRank === r
                  ? 'bg-[#ff4655] text-white shadow-[0_0_10px_rgba(255,70,85,0.4)]'
                  : 'bg-white/5 text-[#a4b0be] hover:text-white hover:bg-white/10'
              }`}
            >
              {r === 'ALL' ? 'Tüm Ranklar' : r}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Takım veya harita ara..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#090d18] border border-white/10 focus:border-[#a855f7] rounded-lg text-xs text-white placeholder-zinc-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid of Scrim Cards */}
      {filteredScrims.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/15 bg-[#0e1424]/40 p-6">
          <Swords className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wide">
            Henüz Aktif Scrim İlanı Bulunmuyor
          </h3>
          <p className="text-[#a4b0be] text-xs max-w-md mx-auto mt-1 mb-5">
            Sistemde bot veya yapay maç ilanları yer almaz. Takımınızla pratik yapmak için ilk antrenman ilanını siz açın!
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4655] to-[#c92a38] text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(255,70,85,0.4)] cursor-pointer"
          >
            Yeni Scrim Kur
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="scrimsList">
          <AnimatePresence>
            {filteredScrims.map((scrim) => {
              const isJoined = joinedScrimIds.includes(scrim.id);
              const isMine = scrim.authorRiotId.toLowerCase() === currentUser.riotId.toLowerCase();
              const isHighlight = scrim.id === highlightedScrimId || scrim.isNewlyCreated;

              const trackerProfileUrl =
                scrim.authorTrackerUrl ||
                `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(
                  scrim.authorRiotId.replace('#', '%23')
                )}/overview`;

              return (
                <motion.div
                  key={scrim.id}
                  layout
                  initial={{ opacity: 0, y: -25, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                  className={`group relative rounded-xl bg-[#0e1424]/85 border p-5 backdrop-blur-md transition-all shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between ${
                    isHighlight
                      ? 'border-[#ff4655] ring-2 ring-[#ff4655]/60 shadow-[0_0_30px_rgba(255,70,85,0.45)]'
                      : 'border-white/10 hover:border-[#ff4655]/50'
                  }`}
                >
                  {/* Newly Created Badge */}
                  {isHighlight && (
                    <div className="absolute -top-2.5 right-4 z-10 px-2.5 py-0.5 rounded-full bg-[#ff4655] text-white text-[10px] font-mono font-black uppercase tracking-wider shadow-[0_0_12px_#ff4655] flex items-center gap-1 animate-bounce">
                      <Sparkles className="w-3 h-3" />
                      <span>YENİ DÜŞTÜ</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-rajdhani font-bold text-lg text-white group-hover:text-[#ff4655] transition-colors uppercase tracking-wide">
                          {scrim.teamName}
                        </h3>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <span className="text-[11px] font-mono text-[#a4b0be] tracking-wider">
                            [{scrim.tag}] • Kuran: <strong className="text-white">{scrim.authorRiotId}</strong>
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
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-rajdhani font-bold uppercase tracking-wider border shrink-0 ${getRankBadgeColor(
                          scrim.rank
                        )}`}
                      >
                        {scrim.rank}
                      </span>
                    </div>

                    <div className="space-y-2 my-3 text-xs text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#ff4655]" />
                        <span className="font-semibold">{scrim.time}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-bold text-[#a855f7] border border-[#a855f7]/20">
                          {scrim.format}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#a855f7] shrink-0" />
                        <span className="text-[11px] text-[#a4b0be]">Haritalar:</span>
                        {scrim.maps.map((map) => (
                          <span
                            key={map}
                            className="px-2 py-0.5 rounded bg-[#141c2e] border border-white/10 text-[10px] text-zinc-200 font-medium"
                          >
                            {map}
                          </span>
                        ))}
                      </div>

                      {scrim.contact && (
                        <div className="text-[11px] text-zinc-400 pt-1">
                          İletişim: <span className="text-white font-mono">{scrim.contact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    {isMine ? (
                      <button
                        onClick={() => setDeletingScrimId(scrim.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/30 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>İlanı Kaldır</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleJoinScrim(scrim)}
                          disabled={isJoined}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            isJoined
                              ? 'bg-[#00b894]/20 border border-[#00b894]/40 text-[#00b894] cursor-default'
                              : 'bg-[#141c2e] hover:bg-[#ff4655] border border-white/15 hover:border-[#ff4655] text-white active:scale-95'
                          }`}
                        >
                          {isJoined ? 'İstek Gönderildi' : 'İlana Katıl'}
                        </button>

                        <button
                          onClick={() => onStartChat(scrim.authorRiotId)}
                          title="İlan Sahibiyle Sohbet Et"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#7000ff]/20 text-zinc-300 hover:text-white border border-white/10 hover:border-[#a855f7] cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onAddFriend(scrim.authorRiotId)}
                          title="Arkadaş Ekle"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#00b894]/20 text-zinc-300 hover:text-[#00b894] border border-white/10 hover:border-[#00b894] cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
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
        isOpen={!!deployingScrim}
        listingType="scrim"
        title={deployingScrim?.teamName || ''}
        authorRiotId={currentUser.riotId}
        rank={deployingScrim?.rank || 'IMMORTAL'}
        trackerUrl={currentUser.trackerUrl}
        onComplete={handleDeployComplete}
      />

      {/* MODAL: Yeni Scrim Kur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d1424] border border-[#ff4655]/40 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-[#ff4655]" />
                <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider">
                  Yeni Scrim İlanı Oluştur
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                    Takım Adı
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Örn: Apex Esports"
                    required
                    className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#ff4655] rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                    Kısaltma (Tag)
                  </label>
                  <input
                    type="text"
                    value={teamTag}
                    onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                    placeholder="APX"
                    maxLength={4}
                    className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#ff4655] rounded-lg text-sm text-white placeholder-zinc-500 outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                    Rank Seviyesi
                  </label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#ff4655] rounded-lg text-sm text-white outline-none"
                  >
                    <option value="Immortal">Immortal</option>
                    <option value="Radiant">Radiant</option>
                    <option value="Ascendant">Ascendant</option>
                    <option value="Diamond">Diamond</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#ff4655] rounded-lg text-sm text-white outline-none"
                  >
                    <option value="Bo3">Bo3 (Standart)</option>
                    <option value="Bo1">Bo1 (Hızlı)</option>
                    <option value="Bo5">Bo5 (Uzun Seri)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  Tarih & Saat
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="Bugün 21:00 veya Yarın 20:30"
                  required
                  className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#ff4655] rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  İletişim (Discord / Riot ID)
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="discord: captain#0001 veya Riot ID"
                  required
                  className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#ff4655] rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1.5">
                  Harita Havuzu Seçimi
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {VALORANT_MAPS.map((map) => {
                    const isSelected = selectedMaps.includes(map);
                    return (
                      <button
                        type="button"
                        key={map}
                        onClick={() => toggleMapSelection(map)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all ${
                          isSelected
                            ? 'bg-[#ff4655] text-white border-[#ff4655] shadow-[0_0_10px_rgba(255,70,85,0.4)]'
                            : 'bg-[#090d18] text-[#a4b0be] border-white/15 hover:border-white/30'
                        }`}
                      >
                        {map}
                      </button>
                    );
                  })}
                </div>
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
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#ff4655] to-[#c92a38] text-white text-xs font-rajdhani font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(255,70,85,0.4)] hover:shadow-[0_6px_20px_rgba(255,70,85,0.6)] transition-all cursor-pointer"
                >
                  İlanı Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scrim Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={deletingScrimId !== null}
        title="Scrim İlanını Silmek İstediğinize Emin Misiniz?"
        description="Bu antrenman maçı ilanı silindiğinde lobiden kaldırılacak ve diğer takımlar maça katılamayacaktır. Bu işlem geri alınamaz."
        confirmText="Evet, İlanı Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingScrimId(null)}
      />
    </div>
  );
};
