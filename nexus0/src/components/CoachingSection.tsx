import React, { useState } from 'react';
import { CoachApplication, UserAccount } from '../types';
import {
  Award,
  UserCheck,
  UserPlus,
  MessageSquare,
  Plus,
  Trash2,
  X,
  Star,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { ValorantListingDeployLoader } from './ValorantListingDeployLoader';
import { motion, AnimatePresence } from 'motion/react';

interface CoachingSectionProps {
  currentUser: UserAccount;
  coachApplications: CoachApplication[];
  onSubmitApplication: (app: CoachApplication) => void;
  onDeleteApplication: (id: string) => void;
  onAddFriend: (riotId: string) => void;
  onStartChat: (riotId: string) => void;
  onNavigateToAdmin?: () => void;
  onRequireTrackerAuth?: (context: 'scrim' | 'team' | 'coaching') => void;
  isAdmin?: boolean;
  pendingAdminCount?: number;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CoachingSection: React.FC<CoachingSectionProps> = ({
  currentUser,
  coachApplications,
  onSubmitApplication,
  onDeleteApplication,
  onAddFriend,
  onStartChat,
  onNavigateToAdmin,
  onRequireTrackerAuth,
  isAdmin = false,
  pendingAdminCount = 0,
  showToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

  // Deploy loader state
  const [deployingApp, setDeployingApp] = useState<CoachApplication | null>(null);

  // Form states
  const [rank, setRank] = useState('Immortal 3');
  const [specialty, setSpecialty] = useState('Duelist & Iso Aim Mekanikleri, Entry Fragging');
  const [hourlyRate, setHourlyRate] = useState('200 ₺ / Saat');
  const [trackerUrl, setTrackerUrl] = useState(currentUser.trackerUrl || '');
  const [experience, setExperience] = useState('');

  // Active / Approved coaches that are publicly visible
  const activeCoaches = coachApplications.filter(
    (c) => c.status === 'approved' || c.status === 'Aktif Koç'
  );

  // Current user's pending application (if any)
  const myPendingApp = coachApplications.find(
    (c) =>
      c.applicantRiotId.toLowerCase() === currentUser.riotId.toLowerCase() &&
      (c.status === 'pending' || c.status === 'İncelemede')
  );

  // Current user's rejected application (if any)
  const myRejectedApp = coachApplications.find(
    (c) =>
      c.applicantRiotId.toLowerCase() === currentUser.riotId.toLowerCase() &&
      c.status === 'rejected'
  );

  const handleOpenApplicationModal = () => {
    if (!currentUser.isTrackerVerified && onRequireTrackerAuth) {
      showToast('Koçluk ilanı ve başvurusu için Tracker.gg profilinizi doğrulamanız gerekmektedir.', 'info');
      onRequireTrackerAuth('coaching');
      return;
    }
    setTrackerUrl(currentUser.trackerUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!experience.trim()) {
      showToast('Lütfen koçluk deneyiminizi ve öğretme metodunuzu açıklayınız.', 'error');
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newApp: CoachApplication = {
      id: `coach-app-${Date.now()}`,
      applicantRiotId: currentUser.riotId,
      applicantEmail: currentUser.email,
      rank,
      specialty,
      hourlyRate: hourlyRate.trim() || 'Ücretsiz / Gönüllü',
      trackerUrl: (trackerUrl || currentUser.trackerUrl || '').trim(),
      experience: experience.trim(),
      status: 'pending', // Sent to Admin for approval
      createdAt: `Bugün ${timeStr}`,
    };

    setIsModalOpen(false);
    setDeployingApp(newApp);
    setExperience('');
  };

  const handleDeployComplete = () => {
    if (!deployingApp) return;
    onSubmitApplication(deployingApp);
    showToast(
      'Koçluk başvurunuz Valorant protokolüyle alındı! Yönetici onayından sonra otomatik olarak sitede koç ilanı olarak yayınlanacaktır.',
      'success'
    );
    setDeployingApp(null);
  };

  const confirmDelete = () => {
    if (deletingAppId) {
      onDeleteApplication(deletingAppId);
      setDeletingAppId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Quick Action Banner (Shown if current user has Admin privileges) */}
      {isAdmin && onNavigateToAdmin && (
        <div className="rounded-2xl bg-gradient-to-r from-[#7000ff]/20 via-[#0e1424] to-[#a855f7]/20 border border-[#a855f7]/50 p-4 backdrop-blur-md flex items-center justify-between gap-4 shadow-[0_0_20px_rgba(112,0,255,0.25)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7000ff]/30 border border-[#a855f7]/40 flex items-center justify-center text-[#a855f7] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-rajdhani font-black text-sm text-white uppercase tracking-wider">
                  Yönetici / Admin Modu Aktif
                </span>
                {pendingAdminCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-[#f59e0b] text-black font-rajdhani font-black text-[11px] uppercase tracking-wider animate-pulse">
                    {pendingAdminCount} Onay Bekleyen
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300">
                {pendingAdminCount > 0
                  ? `İncelenmeyi bekleyen ${pendingAdminCount} adet koçluk başvurusu var. Onayladığınızda sitede otomatik yayınlanacaktır.`
                  : 'Şu an bekleyen yeni başvuru yok. Onaylanan koçları yönetmek için paneli açabilirsiniz.'}
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToAdmin}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(112,0,255,0.4)] transition-all cursor-pointer"
          >
            <span>Admin Paneline Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Current User's Pending Application Banner */}
      {myPendingApp && (
        <div className="rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/40 p-4.5 backdrop-blur-md shadow-[0_10px_25px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] shrink-0 mt-0.5">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-rajdhani font-black text-base text-white uppercase tracking-wider">
                  Koçluk Başvurunuz Yönetici İncelenmesinde
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 font-rajdhani font-bold text-[10px] uppercase tracking-wider">
                  Onay Bekliyor
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {myPendingApp.createdAt}
                </span>
              </div>
              <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
                Başvurunuz Nexus Yönetim Paneline iletildi. Admin onayından sonra otomatik olarak aşağıdaki koçlar listesinde tüm topluluğa yayınlanacaktır.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-2 flex-wrap">
                <span>Uzmanlık: <strong className="text-zinc-200">{myPendingApp.specialty}</strong></span>
                <span>•</span>
                <span>Tarife: <strong className="text-emerald-400">{myPendingApp.hourlyRate}</strong></span>
                <span>•</span>
                <span>Rank: <strong className="text-[#ff4655]">{myPendingApp.rank}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setDeletingAppId(myPendingApp.id)}
            className="self-start sm:self-auto shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/30 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Başvuruyu Geri Çek"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Başvurumu İptal Et</span>
          </button>
        </div>
      )}

      {/* Current User's Rejected Application Banner */}
      {myRejectedApp && !myPendingApp && (
        <div className="rounded-2xl bg-[#ff4655]/10 border border-[#ff4655]/40 p-4.5 backdrop-blur-md shadow-[0_10px_25px_rgba(255,70,85,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff4655]/20 border border-[#ff4655]/40 flex items-center justify-center text-[#ff4655] shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-rajdhani font-black text-base text-white uppercase tracking-wider">
                  Son Koçluk Başvurunuz Onaylanmadı
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#ff4655]/20 text-[#ff4655] border border-[#ff4655]/40 font-rajdhani font-bold text-[10px] uppercase tracking-wider">
                  Reddedildi
                </span>
              </div>
              <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
                {myRejectedApp.adminNote
                  ? `Yönetici Açıklaması: "${myRejectedApp.adminNote}"`
                  : 'Yönetici incelemesi sonucunda başvurunuz onaylanmadı. Bilgilerinizi güncelleyerek yeniden başvuru yapabilirsiniz.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => onDeleteApplication(myRejectedApp.id)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Bildirimi Kapat
            </button>
            <button
              onClick={() => {
                onDeleteApplication(myRejectedApp.id);
                handleOpenApplicationModal();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white text-xs font-rajdhani font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(112,0,255,0.4)] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeniden Başvur</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Banner */}
      <div className="rounded-2xl bg-[#0e1424]/85 border border-[#ff4655]/25 p-6 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#a855f7] font-rajdhani font-bold text-xs uppercase tracking-widest mb-1">
            <Award className="w-4 h-4" />
            <span>TOPLULUK KOÇLUK & AKADEMİ MERKEZİ</span>
          </div>
          <h2 className="font-rajdhani font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            Onaylı Koçlar & Birebir Gelişim
          </h2>
          <p className="text-[#a4b0be] text-xs sm:text-sm mt-1 max-w-xl">
            Sitede listelenen tüm koçlar yönetici onayından geçmiştir. Yüksek elo oyunculardan ders talep edebilir veya siz de koç olmak için başvuruda bulunabilirsiniz.
          </p>
        </div>

        <button
          onClick={handleOpenApplicationModal}
          disabled={!!myPendingApp}
          className={`shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-rajdhani font-bold text-sm uppercase tracking-wider transition-all cursor-pointer ${
            myPendingApp
              ? 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed opacity-70'
              : 'bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white shadow-[0_4px_20px_rgba(112,0,255,0.4)] active:scale-95'
          }`}
          title={myPendingApp ? 'Zaten incelemede olan bir başvurunuz bulunmaktadır.' : 'Koçluk Başvuru Formunu Aç'}
        >
          <Plus className="w-4 h-4" />
          <span>{myPendingApp ? 'Başvurunuz İncelemede' : 'Koç Başvurusu Yap'}</span>
        </button>
      </div>

      {/* Grid of Approved Public Coaches */}
      {activeCoaches.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/15 bg-[#0e1424]/40 p-6">
          <Award className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wide">
            Şu An Sitede Yayında Olan Onaylı Koç Bulunmuyor
          </h3>
          <p className="text-[#a4b0be] text-xs max-w-md mx-auto mt-1 mb-5">
            Sistemde yapay koç veya bot profil bulunmaz. Yapılan koçluk başvuruları admin tarafından onaylandıktan sonra anında burada yayınlanır!
          </p>
          <button
            onClick={handleOpenApplicationModal}
            disabled={!!myPendingApp}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(112,0,255,0.4)] cursor-pointer"
          >
            {myPendingApp ? 'Başvurunuz İncelemede' : 'İlk Koç Başvurusunu Yap'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeCoaches.map((coach) => {
            const isMine = coach.applicantRiotId.toLowerCase() === currentUser.riotId.toLowerCase();

            return (
              <div
                key={coach.id}
                className="group relative rounded-xl bg-[#0e1424]/85 border border-white/10 hover:border-[#a855f7]/60 p-5 backdrop-blur-md transition-all shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded bg-[#00b894]/20 text-[#00b894] border border-[#00b894]/40 font-rajdhani font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Onaylı Koç
                        </span>
                        {isMine && (
                          <span className="px-1.5 py-0.5 rounded bg-[#7000ff]/30 text-[#d8b4fe] border border-[#a855f7]/40 font-rajdhani font-bold text-[9px] uppercase tracking-wider">
                            Senin İlanın
                          </span>
                        )}
                      </div>
                      <h3 className="font-rajdhani font-black text-xl text-white group-hover:text-[#a855f7] transition-colors tracking-wide">
                        {coach.applicantRiotId}
                      </h3>
                      <span className="text-xs font-mono text-[#ff4655] font-bold">
                        Rank: {coach.rank}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block uppercase font-rajdhani font-bold">Saatlik Ücret</span>
                      <span className="font-rajdhani font-black text-base text-emerald-400">
                        {coach.hourlyRate}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#090d18]/60 border border-white/5 mb-3">
                    <span className="block text-[10px] font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-0.5">
                      Uzmanlık & Odak Alanı
                    </span>
                    <p className="text-xs font-semibold text-zinc-200">
                      {coach.specialty}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                    {coach.experience}
                  </p>

                  {coach.trackerUrl && (
                    <a
                      href={coach.trackerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#a855f7] hover:underline mb-3"
                    >
                      <span>Tracker Profili / VOD Kanıtı</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  {isMine ? (
                    <button
                      onClick={() => setDeletingAppId(coach.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/30 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>İlanımı Kaldır</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onAddFriend(coach.applicantRiotId)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#141c2e] hover:bg-[#7000ff] border border-white/10 hover:border-[#a855f7] text-white text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                        title="Arkadaşlık İsteği Gönder"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>İstek Gönder</span>
                      </button>

                      <button
                        onClick={() => onStartChat(coach.applicantRiotId)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#141c2e] hover:bg-[#a855f7] border border-white/10 hover:border-[#a855f7] text-white text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ders Talep Et</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Koç Başvurusu Yap */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-[#0d1424] border border-[#a855f7]/40 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#a855f7]" />
                <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider">
                  Koçluk Başvuru Formu
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informative notice about Admin Review */}
            <div className="p-3 rounded-xl bg-[#7000ff]/15 border border-[#a855f7]/30 mb-4 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#a855f7] shrink-0 mt-0.5" />
              <div className="text-[11px] text-zinc-300 leading-relaxed">
                <strong className="text-white">Admin Onaylı Sistem:</strong> Gönderdiğiniz başvuru Nexus Yönetici Paneline iletilir. Yönetici onayının ardından ilanınız sitede otomatik olarak yayınlanacaktır.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  Kullanıcı Adınız (Riot ID)
                </label>
                <input
                  type="text"
                  value={currentUser.riotId}
                  disabled
                  className="w-full px-3 py-2 bg-[#090d18]/60 border border-white/10 rounded-lg text-sm text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                    Mevcut Rank
                  </label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#a855f7] rounded-lg text-sm text-white outline-none"
                  >
                    <option value="Radiant">Radiant</option>
                    <option value="Immortal 3">Immortal 3</option>
                    <option value="Immortal 2">Immortal 2</option>
                    <option value="Immortal 1">Immortal 1</option>
                    <option value="Ascendant 3">Ascendant 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                    Saatlik Tarife / Ücret
                  </label>
                  <input
                    type="text"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="Örn: 200 ₺ / Saat veya Ücretsiz"
                    required
                    className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#a855f7] rounded-lg text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  Koçluk Uzmanlık Alanı
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Örn: Duelist & Iso Aim, IGL Karar Alma, Sova/Fade Lineupları"
                  required
                  className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#a855f7] rounded-lg text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  Deneyiminiz & Öğretme Yönteminiz
                </label>
                <textarea
                  rows={3}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Daha önce takım yönetimi veya birebir koçluk yaptınız mı? VOD incelemesi ve canlı Discord yayını ile nasıl analiz sunacaksınız..."
                  required
                  className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#a855f7] rounded-lg text-sm text-white placeholder-zinc-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1">
                  Tracker.gg Profili veya VOD Bağlantısı (İsteğe Bağlı)
                </label>
                <input
                  type="url"
                  value={trackerUrl}
                  onChange={(e) => setTrackerUrl(e.target.value)}
                  placeholder="https://tracker.gg/valorant/profile/riot/..."
                  className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#a855f7] rounded-lg text-sm text-white outline-none"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#a4b0be] hover:text-white text-xs font-rajdhani font-bold uppercase tracking-wider cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white text-xs font-rajdhani font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(112,0,255,0.4)] cursor-pointer"
                >
                  Başvuruyu Onaya Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Coach Application Confirmation Dialog */}
      <ConfirmModal
        isOpen={deletingAppId !== null}
        title="Koçluk Başvurusunu Silmek İstediğinize Emin Misiniz?"
        description="Koçluk başvurunuz silindiğinde diğer oyuncular sizi koçlar listesinde göremez ve ders talebi gönderemez. Bu işlem geri alınamaz."
        confirmText="Evet, Başvurumu Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingAppId(null)}
      />

      {/* Valorant Deployment Loading Screen */}
      <ValorantListingDeployLoader
        isOpen={!!deployingApp}
        listingType="coaching"
        title={`${deployingApp?.rank || 'IMMORTAL'} Koçluk Başvurusu`}
        authorRiotId={currentUser.riotId}
        rank={deployingApp?.rank || 'IMMORTAL'}
        trackerUrl={currentUser.trackerUrl}
        onComplete={handleDeployComplete}
      />
    </div>
  );
};
