import React, { useState } from 'react';
import { CoachApplication, UserAccount, ScrimItem, TeamRecruitment } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ExternalLink,
  Trash2,
  RotateCcw,
  Sparkles,
  Eye,
  Filter,
  Check,
  X,
  AlertTriangle,
  Radio,
  MessageSquare,
  Lock,
  KeyRound,
  Save,
  LogOut,
  Users,
  Search,
  Swords
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { DiscordIntegrationPanel } from './DiscordIntegrationPanel';
import { getDiscordWebhookUrl } from '../utils/discord';

interface AdminPanelProps {
  currentUser: UserAccount;
  coachApplications: CoachApplication[];
  onApproveApplication: (id: string) => void;
  onRejectApplication: (id: string, note?: string) => void;
  onDeleteApplication: (id: string) => void;
  onRevertApplication: (id: string) => void;
  onCreateTestApplication?: () => void;
  onNavigateToCoaching: () => void;
  onAdminLogout?: () => void;
  registeredUsers?: UserAccount[];
  onDeleteUser?: (email: string) => void;
  scrims?: ScrimItem[];
  teamListings?: TeamRecruitment[];
  onDeleteScrim?: (id: string) => void;
  onDeleteTeamListing?: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  coachApplications,
  onApproveApplication,
  onRejectApplication,
  onDeleteApplication,
  onRevertApplication,
  onCreateTestApplication,
  onNavigateToCoaching,
  onAdminLogout,
  registeredUsers = [],
  onDeleteUser,
  scrims = [],
  teamListings = [],
  onDeleteScrim,
  onDeleteTeamListing,
  showToast,
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'users' | 'coaching' | 'listings' | 'discord' | 'security'>('users');
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const isDiscordConfigured = !!getDiscordWebhookUrl();

  // Normalize status helper
  const getStatus = (app: CoachApplication): 'pending' | 'approved' | 'rejected' => {
    if (app.status === 'Aktif Koç' || app.status === 'approved') return 'approved';
    if (app.status === 'rejected') return 'rejected';
    return 'pending'; // 'pending' or 'İncelemede' or default
  };

  const pendingApps = coachApplications.filter((a) => getStatus(a) === 'pending');
  const approvedApps = coachApplications.filter((a) => getStatus(a) === 'approved');
  const rejectedApps = coachApplications.filter((a) => getStatus(a) === 'rejected');

  const filteredApps = coachApplications.filter((a) => {
    const s = getStatus(a);
    if (filter === 'all') return true;
    return s === filter;
  });

  const handleConfirmReject = () => {
    if (!rejectingId) return;
    onRejectApplication(rejectingId, rejectReason.trim() || undefined);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Admin Panel Header Banner */}
      <div className="rounded-2xl bg-[#0e1424]/90 border border-[#a855f7]/40 p-6 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.6),0_0_25px_rgba(112,0,255,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#a855f7] font-rajdhani font-bold text-xs uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4 text-[#a855f7]" />
            <span>NEXUS YÖNETİCİ & ONAY MERKEZİ</span>
            <span className="px-2 py-0.5 rounded bg-[#7000ff]/20 text-[#d8b4fe] border border-[#a855f7]/30 text-[10px]">
              Yetkili: {currentUser.email || currentUser.riotId}
            </span>
          </div>
          <h2 className="font-rajdhani font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            Koçluk Başvuru Onay Paneli
          </h2>
          <p className="text-[#a4b0be] text-xs sm:text-sm mt-1 max-w-2xl">
            Oyuncular tarafından yapılan koçluk başvuruları bu panele düşer. İnceleyip onayladığınız başvurular <strong className="text-white font-semibold">otomatik olarak siteye koç ilanı</strong> olarak anında yayınlanır.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNavigateToCoaching}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#141c2e] hover:bg-[#1a253c] text-white border border-white/10 hover:border-white/20 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#00b894]" />
            <span>Sitedeki Koçları Gör</span>
          </button>

          {onCreateTestApplication && (
            <button
              onClick={onCreateTestApplication}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 text-white text-xs font-rajdhani font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(112,0,255,0.4)] transition-all cursor-pointer"
              title="Test amaçlı yeni bir koç başvurusu simüle et"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Örnek Başvuru Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Module Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 flex-wrap">
        <button
          onClick={() => setActiveAdminSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
            activeAdminSubTab === 'users'
              ? 'bg-[#7000ff] text-white border-[#a855f7] shadow-[0_0_15px_rgba(112,0,255,0.4)]'
              : 'bg-[#141c2e] text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
          }`}
        >
          <Users className="w-4 h-4 text-[#a855f7]" />
          <span>Kayıtlı Oyuncular</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
            {registeredUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('coaching')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
            activeAdminSubTab === 'coaching'
              ? 'bg-gradient-to-r from-[#7000ff] to-[#a855f7] text-white border-[#a855f7]/60 shadow-[0_0_15px_rgba(112,0,255,0.4)]'
              : 'bg-[#141c2e] text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Koçluk Başvuru Onayları</span>
          {pendingApps.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#f59e0b] text-black shadow-sm">
              {pendingApps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminSubTab('listings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
            activeAdminSubTab === 'listings'
              ? 'bg-[#00b894] text-white border-[#55efc4] shadow-[0_0_15px_rgba(0,184,148,0.4)]'
              : 'bg-[#141c2e] text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
          }`}
        >
          <Swords className="w-4 h-4 text-[#00b894]" />
          <span>İlan Yönetimi</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
            {scrims.length + teamListings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('discord')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
            activeAdminSubTab === 'discord'
              ? 'bg-[#5865F2] text-white border-[#5865F2] shadow-[0_0_15px_rgba(88,101,242,0.4)]'
              : 'bg-[#141c2e] text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
          }`}
        >
          <Radio className="w-4 h-4 text-[#7983f5]" />
          <span>Discord İlan Botu & Webhook</span>
          {isDiscordConfigured ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Bağlı ✓
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              Kurulum Bekliyor
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminSubTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-rajdhani font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
            activeAdminSubTab === 'security'
              ? 'bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-[#141c2e] text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
          }`}
        >
          <Lock className="w-4 h-4 text-[#f59e0b]" />
          <span>Admin Güvenliği</span>
        </button>
      </div>

      {/* SUBTAB: USERS */}
      {activeAdminSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#0e1424] border border-white/10">
            <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Riot ID veya e-posta ile ara..."
                className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
            <div className="text-xs font-mono text-zinc-400">
              Kayıtlı Oyuncu: <span className="text-white font-bold">{registeredUsers.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredUsers
              .filter(
                (u) =>
                  u.riotId.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
              )
              .map((u) => (
                <div
                  key={u.email}
                  className="p-4 rounded-2xl bg-[#0e1424] border border-white/10 flex flex-col justify-between gap-3 shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-rajdhani font-black text-lg text-white">{u.riotId}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#ff4655]/20 text-[#ff4655] border border-[#ff4655]/40 font-bold">
                        {u.rank || 'UNRANKED'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono mb-2">{u.email}</div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <span>Rol: {u.role || 'Oyuncu'}</span>
                      {u.isTrackerVerified && (
                        <span className="px-1.5 py-0.2 rounded bg-[#00b894]/20 text-[#00b894] font-bold">
                          Tracker ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {onDeleteUser && (
                    <button
                      onClick={() => onDeleteUser(u.email)}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-[#ff4655]/20 text-zinc-400 hover:text-[#ff4655] border border-white/10 hover:border-[#ff4655]/30 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Oyuncuyu Sil</span>
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SUBTAB: LISTINGS */}
      {activeAdminSubTab === 'listings' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-rajdhani font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <Swords className="w-4 h-4 text-[#ff4655]" />
              <span>Aktif Scrim İlanları ({scrims.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scrims.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-[#0e1424] border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-rajdhani font-bold text-white text-sm">
                      {s.teamName} <span className="text-zinc-500">[{s.tag}]</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Rank: <strong className="text-zinc-200">{s.rank}</strong> • Saat: {s.time} • {s.format}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Oluşturan: {s.authorRiotId}
                    </div>
                  </div>
                  {onDeleteScrim && (
                    <button
                      onClick={() => onDeleteScrim(s.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-[#ff4655]/20 text-zinc-400 hover:text-[#ff4655] border border-white/10 hover:border-[#ff4655]/40 transition-all cursor-pointer"
                      title="İlanı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {scrims.length === 0 && (
                <div className="p-6 text-zinc-500 text-xs rounded-xl bg-[#0e1424] border border-white/5 col-span-2">
                  Aktif scrim ilanı bulunmuyor.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-rajdhani font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00b894]" />
              <span>Takım ve Oyuncu İlanları ({teamListings.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teamListings.map((t) => (
                <div key={t.id} className="p-4 rounded-xl bg-[#0e1424] border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-rajdhani font-bold text-white text-sm">
                      <span className="text-[#00b894] font-mono mr-1.5">[{t.type}]</span>
                      {t.title}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Rol: <strong className="text-zinc-200">{t.role}</strong> • Rank: {t.rank}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      İlan Sahibi: {t.authorRiotId}
                    </div>
                  </div>
                  {onDeleteTeamListing && (
                    <button
                      onClick={() => onDeleteTeamListing(t.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-[#ff4655]/20 text-zinc-400 hover:text-[#ff4655] border border-white/10 hover:border-[#ff4655]/40 transition-all cursor-pointer"
                      title="İlanı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {teamListings.length === 0 && (
                <div className="p-6 text-zinc-500 text-xs rounded-xl bg-[#0e1424] border border-white/5 col-span-2">
                  Aktif takım ilanı bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeAdminSubTab === 'discord' && (
        <DiscordIntegrationPanel currentUser={currentUser} showToast={showToast} />
      )}

      {/* SUBTAB: SECURITY */}
      {activeAdminSubTab === 'security' && (
        <div className="rounded-2xl bg-[#0e1424]/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.6)] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b]">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider">
                  Admin Panel Güvenlik & Yetki Kontrolü
                </h3>
                <p className="text-xs text-zinc-400">
                  Yetkili işlemlerinizi tamamladıktan sonra oturumu kapatıp normal oyuncu moduna güvenle dönebilirsiniz.
                </p>
              </div>
            </div>

            {onAdminLogout && (
              <button
                type="button"
                onClick={onAdminLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/30 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Yönetici Oturumunu Kapat</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-sm font-rajdhani font-bold text-white uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Erişim Gizliliği</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Admin paneli normal ziyaretçilere ve oyunculara tamamen kapalıdır. Menüde veya arayüzde hiçbir harici bağlantı veya buton bulunmaz.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-sm font-rajdhani font-bold text-white uppercase">
                <Lock className="w-4 h-4 text-[#f59e0b]" />
                <span>Güvenli Oturum Çıkışı</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Yönetici oturumunu kapattığınızda bu panel derhal kilitlenir ve menüden kaybolur. Tekrar açmak için gizli yetkilendirme tetikleyicisini kullanabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeAdminSubTab === 'coaching' && (
        <>
          {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Card */}
        <div
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filter === 'pending'
              ? 'bg-[#f59e0b]/15 border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              : 'bg-[#0e1424]/70 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-rajdhani font-bold uppercase tracking-wider text-[#f59e0b] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 animate-pulse" /> Onay Bekleyenler
            </span>
            {pendingApps.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping" />
            )}
          </div>
          <div className="text-3xl font-rajdhani font-black text-white">
            {pendingApps.length}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">İnceleme ve onayınızı bekliyor</p>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setFilter('approved')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filter === 'approved'
              ? 'bg-[#00b894]/15 border-[#00b894] shadow-[0_0_20px_rgba(0,184,148,0.25)]'
              : 'bg-[#0e1424]/70 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-rajdhani font-bold uppercase tracking-wider text-[#00b894] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sitede Yayında
            </span>
          </div>
          <div className="text-3xl font-rajdhani font-black text-white">
            {approvedApps.length}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Sitede aktif koç olarak listeleniyor</p>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setFilter('rejected')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filter === 'rejected'
              ? 'bg-[#ff4655]/15 border-[#ff4655] shadow-[0_0_20px_rgba(255,70,85,0.25)]'
              : 'bg-[#0e1424]/70 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-rajdhani font-bold uppercase tracking-wider text-[#ff4655] flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Reddedilenler
            </span>
          </div>
          <div className="text-3xl font-rajdhani font-black text-white">
            {rejectedApps.length}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Uygun görülmeyen başvurular</p>
        </div>

        {/* Total Card */}
        <div
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#7000ff]/15 border-[#a855f7] shadow-[0_0_20px_rgba(112,0,255,0.25)]'
              : 'bg-[#0e1424]/70 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-rajdhani font-bold uppercase tracking-wider text-[#a855f7] flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Toplam Başvuru
            </span>
          </div>
          <div className="text-3xl font-rajdhani font-black text-white">
            {coachApplications.length}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Tüm zamanların başvuruları</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-400">
            Filtrele:
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-[#f59e0b] text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : 'bg-[#141c2e] text-zinc-300 hover:text-white'
              }`}
            >
              Bekleyenler ({pendingApps.length})
            </button>

            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'approved'
                  ? 'bg-[#00b894] text-white shadow-[0_0_10px_rgba(0,184,148,0.5)]'
                  : 'bg-[#141c2e] text-zinc-300 hover:text-white'
              }`}
            >
              Yayındakiler ({approvedApps.length})
            </button>

            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-1 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'rejected'
                  ? 'bg-[#ff4655] text-white shadow-[0_0_10px_rgba(255,70,85,0.5)]'
                  : 'bg-[#141c2e] text-zinc-300 hover:text-white'
              }`}
            >
              Reddedilenler ({rejectedApps.length})
            </button>

            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#7000ff] text-white'
                  : 'bg-[#141c2e] text-zinc-300 hover:text-white'
              }`}
            >
              Tümü ({coachApplications.length})
            </button>
          </div>
        </div>

        <div className="text-xs text-zinc-400">
          Listelenen: <span className="font-bold text-white">{filteredApps.length}</span> başvuru
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/15 bg-[#0e1424]/40 p-6">
          <Award className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wide">
            {filter === 'pending'
              ? 'Onay Bekleyen Yeni Koçluk Başvurusu Yok'
              : filter === 'approved'
              ? 'Henüz Onaylanmış ve Yayında Olan Koç Yok'
              : filter === 'rejected'
              ? 'Reddedilmiş Başvuru Bulunmuyor'
              : 'Henüz Hiç Koçluk Başvurusu Yapılmamış'}
          </h3>
          <p className="text-[#a4b0be] text-xs max-w-md mx-auto mt-1 mb-5">
            {filter === 'pending'
              ? 'Yeni bir oyuncu "Koç Başvurusu Yap" formunu doldurduğunda onayınız için otomatik olarak buraya düşecektir.'
              : 'Tüm başvuruları incelemek için filtreyi değiştirebilir veya test etmek için örnek bir başvuru simüle edebilirsiniz.'}
          </p>
          {onCreateTestApplication && filter === 'pending' && (
            <button
              onClick={onCreateTestApplication}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(112,0,255,0.4)] cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Hemen Test Başvurusu Oluştur</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const status = getStatus(app);

            return (
              <div
                key={app.id}
                className={`rounded-2xl border p-5 backdrop-blur-md transition-all shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${
                  status === 'pending'
                    ? 'bg-[#0e1424]/90 border-[#f59e0b]/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : status === 'approved'
                    ? 'bg-[#0e1424]/85 border-[#00b894]/40'
                    : 'bg-[#0e1424]/60 border-white/10 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#141c2e] border border-white/10 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-[#a855f7]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-rajdhani font-black text-xl text-white tracking-wide">
                          {app.applicantRiotId}
                        </span>

                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#ff4655]/20 text-[#ff4655] border border-[#ff4655]/40">
                          {app.rank}
                        </span>

                        {status === 'pending' && (
                          <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 font-rajdhani font-bold uppercase tracking-wider animate-pulse">
                            <Clock className="w-3 h-3" /> Onay Bekliyor
                          </span>
                        )}

                        {status === 'approved' && (
                          <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#00b894]/20 text-[#00b894] border border-[#00b894]/40 font-rajdhani font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Sitede Yayında
                          </span>
                        )}

                        {status === 'rejected' && (
                          <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#ff4655]/20 text-[#ff4655] border border-[#ff4655]/40 font-rajdhani font-bold uppercase tracking-wider">
                            <XCircle className="w-3 h-3" /> Reddedildi
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                        <span>Başvuru Tarihi: <strong className="text-zinc-300">{app.createdAt}</strong></span>
                        {app.applicantEmail && (
                          <span>E-posta: <strong className="text-zinc-300">{app.applicantEmail}</strong></span>
                        )}
                        {app.reviewedAt && (
                          <span>İnceleme: <strong className="text-zinc-300">{app.reviewedAt}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hourly Rate Box */}
                  <div className="bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2 self-start lg:self-auto text-left lg:text-right shrink-0">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-rajdhani font-bold">
                      Talep Edilen Saatlik Ücret
                    </span>
                    <span className="font-rajdhani font-black text-lg text-emerald-400">
                      {app.hourlyRate}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="p-3.5 rounded-xl bg-[#090d18] border border-white/5">
                    <span className="block text-[11px] font-rajdhani font-bold text-[#a855f7] uppercase tracking-wider mb-1">
                      Koçluk Uzmanlık & Odak Alanı
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {app.specialty}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d18] border border-white/5">
                    <span className="block text-[11px] font-rajdhani font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Tracker.gg Profili / VOD İncelemesi
                    </span>
                    {app.trackerUrl ? (
                      <a
                        href={app.trackerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#a855f7] hover:underline font-mono"
                      >
                        <span className="truncate max-w-xs">{app.trackerUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-500 italic">Harici profil linki eklenmemiş</span>
                    )}
                  </div>
                </div>

                {/* Experience Bio */}
                <div className="p-3.5 rounded-xl bg-[#090d18] border border-white/5 mb-4">
                  <span className="block text-[11px] font-rajdhani font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Deneyim ve Öğretme Metodu (Başvuranın Açıklaması)
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                    {app.experience}
                  </p>
                </div>

                {/* If rejected note exists */}
                {app.adminNote && (
                  <div className="p-3 rounded-xl bg-[#ff4655]/10 border border-[#ff4655]/30 mb-4 text-xs text-zinc-300">
                    <strong className="text-[#ff4655]">Yönetici Ret Notu:</strong> {app.adminNote}
                  </div>
                )}

                {/* Action Buttons for Admin */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-zinc-400">
                    {status === 'pending' && (
                      <span className="text-[#f59e0b] font-medium">
                        Bu başvuru onaylandığında anında sitedeki koçlar listesine otomatik düşecektir.
                      </span>
                    )}
                    {status === 'approved' && (
                      <span className="text-[#00b894] font-medium">
                        Bu başvuru şu an tüm site ziyaretçilerine açık olarak yayındadır.
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="text-zinc-500">
                        Bu başvuru reddedildi ve sitede yayında değildir.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setRejectingId(app.id);
                            setRejectReason('');
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/30 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reddet</span>
                        </button>

                        <button
                          onClick={() => onApproveApplication(app.id)}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#00b894] to-[#0984e3] hover:brightness-110 text-white text-xs font-rajdhani font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,184,148,0.4)] transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Onayla & Sitede Yayınla</span>
                        </button>
                      </>
                    )}

                    {status === 'approved' && (
                      <>
                        <button
                          onClick={() => onRevertApplication(app.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141c2e] hover:bg-[#1a253c] text-zinc-300 hover:text-white border border-white/10 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                          title="İlanı yayından geri çek ve tekrar bekleyenler listesine al"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Yayından Kaldır</span>
                        </button>

                        <button
                          onClick={() => setDeletingId(app.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/30 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                          title="İlanı kalıcı olarak sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </>
                    )}

                    {status === 'rejected' && (
                      <>
                        <button
                          onClick={() => onApproveApplication(app.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00b894]/20 hover:bg-[#00b894] text-[#00b894] hover:text-white border border-[#00b894]/40 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Yeniden Onayla</span>
                        </button>

                        <button
                          onClick={() => setDeletingId(app.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ff4655]/15 hover:bg-[#ff4655] text-[#ff4655] hover:text-white border border-[#ff4655]/30 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#0d1424] border border-[#ff4655]/50 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-[#ff4655]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider">
                  Başvuruyu Reddet
                </h3>
              </div>
              <button
                onClick={() => setRejectingId(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 mb-3">
              Bu başvuruyu reddetmek istediğinizden emin misiniz? Dilerseniz başvuran oyuncu için bir gerekçe/not ekleyebilirsiniz.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Örn: Rank kanıtı yetersiz veya tarife topluluk kurallarına uygun değil..."
              className="w-full px-3 py-2 bg-[#090d18] border border-white/15 focus:border-[#ff4655] rounded-xl text-xs text-white placeholder-zinc-500 outline-none resize-none mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-rajdhani font-bold uppercase tracking-wider cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-[#ff4655] hover:bg-[#e63946] text-white text-xs font-rajdhani font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(255,70,85,0.4)] cursor-pointer"
              >
                Başvuruyu Reddet
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Başvuruyu Kalıcı Olarak Silmek İstiyor Musunuz?"
        description="Bu başvuru kaydı sistemden tamamen silinecektir. Bu işlem geri alınamaz."
        confirmText="Evet, Tamamen Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onConfirm={() => {
          if (deletingId) {
            onDeleteApplication(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
