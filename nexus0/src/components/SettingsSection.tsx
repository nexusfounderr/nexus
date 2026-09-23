/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import {
  Settings,
  User,
  KeyRound,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
  Save,
  Check,
  Volume2,
  VolumeX,
  Bell,
  Play,
} from 'lucide-react';
import { soundManager, SoundConfig } from '../utils/soundEffects';

interface SettingsSectionProps {
  currentUser: UserAccount;
  onUpdateUser: (updatedUser: UserAccount, message: string) => void;
  registeredUsers: UserAccount[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isAdmin: boolean;
}

// Cooldown constants in milliseconds
export const COOLDOWNS = {
  USERNAME_DAYS: 7,
  USERNAME_MS: 7 * 24 * 60 * 60 * 1000, // 7 gün
  PASSWORD_DAYS: 3,
  PASSWORD_MS: 3 * 24 * 60 * 60 * 1000, // 3 gün
  EMAIL_DAYS: 7,
  EMAIL_MS: 7 * 24 * 60 * 60 * 1000,    // 7 gün
};

export const VALORANT_RANKS = [
  'IRON 1', 'IRON 2', 'IRON 3',
  'BRONZE 1', 'BRONZE 2', 'BRONZE 3',
  'SILVER 1', 'SILVER 2', 'SILVER 3',
  'GOLD 1', 'GOLD 2', 'GOLD 3',
  'PLATINUM 1', 'PLATINUM 2', 'PLATINUM 3',
  'DIAMOND 1', 'DIAMOND 2', 'DIAMOND 3',
  'ASCENDANT 1', 'ASCENDANT 2', 'ASCENDANT 3',
  'IMMORTAL 1', 'IMMORTAL 2', 'IMMORTAL 3',
  'RADIANT',
];

export const VALORANT_ROLES = [
  'Main Duelist (Iso / Jett / Reyna)',
  'Main Controller (Omen / Viper / Astra)',
  'Main Initiator (Sova / Fade / Gekko)',
  'Main Sentinel (Killjoy / Cypher / Deadlock)',
  'Flex / IGL (Her Role Uyumlu)',
];

export function getCooldownInfo(lastChangedIso?: string, cooldownMs: number = COOLDOWNS.USERNAME_MS) {
  if (!lastChangedIso) {
    return {
      isLocked: false,
      remainingMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      formatted: 'Hemen Değiştirilebilir',
      unlockDateStr: '',
    };
  }

  const lastTime = new Date(lastChangedIso).getTime();
  const unlockTime = lastTime + cooldownMs;
  const now = Date.now();
  const remainingMs = unlockTime - now;

  if (remainingMs <= 0) {
    return {
      isLocked: false,
      remainingMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      formatted: 'Hemen Değiştirilebilir',
      unlockDateStr: '',
    };
  }

  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} gün`);
  if (hours > 0) parts.push(`${hours} saat`);
  if (minutes > 0) parts.push(`${minutes} dk`);
  if (parts.length === 0) parts.push(`${seconds} sn`);

  const unlockDate = new Date(unlockTime);
  const unlockDateStr = `${unlockDate.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
  })} saat ${unlockDate.getHours().toString().padStart(2, '0')}:${unlockDate.getMinutes().toString().padStart(2, '0')}`;

  return {
    isLocked: true,
    remainingMs,
    days,
    hours,
    minutes,
    formatted: parts.join(' '),
    unlockDateStr,
  };
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  currentUser,
  onUpdateUser,
  registeredUsers,
  showToast,
  isAdmin,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'username' | 'password' | 'email' | 'profile' | 'audio'>('username');

  // Real-time tick to update countdowns smoothly every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Cooldown calculation for all three attributes
  const usernameCooldown = getCooldownInfo(currentUser.lastUsernameChange, COOLDOWNS.USERNAME_MS);
  const passwordCooldown = getCooldownInfo(currentUser.lastPasswordChange, COOLDOWNS.PASSWORD_MS);
  const emailCooldown = getCooldownInfo(currentUser.lastEmailChange, COOLDOWNS.EMAIL_MS);

  // Admin bypass mode (lets admin test changes without waiting 7 days)
  const [adminBypass, setAdminBypass] = useState(false);

  // Form states: 1. Username
  const [newRiotName, setNewRiotName] = useState('');
  const [newRiotTag, setNewRiotTag] = useState('TR1');

  // Form states: 2. Password
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);

  // Form states: 3. Email
  const [newEmail, setNewEmail] = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');

  // Form states: 4. Profile
  const [selectedRank, setSelectedRank] = useState(currentUser.rank || 'IMMORTAL 3');
  const [selectedRole, setSelectedRole] = useState(currentUser.role || 'Main Duelist (Iso / Jett)');
  const [userBio, setUserBio] = useState(currentUser.bio || '');

  // Form states: 5. Sound & Audio Effects
  const [soundConfig, setSoundConfig] = useState<SoundConfig>(() => soundManager.getSettings());

  // Pre-fill fields on mount or user change
  useEffect(() => {
    if (currentUser.riotId && currentUser.riotId.includes('#')) {
      const [name, tag] = currentUser.riotId.split('#');
      setNewRiotName(name || '');
      setNewRiotTag(tag || 'TR1');
    } else {
      setNewRiotName(currentUser.riotId || '');
      setNewRiotTag('TR1');
    }
    setNewEmail(currentUser.email || '');
    setSelectedRank(currentUser.rank || 'IMMORTAL 3');
    setSelectedRole(currentUser.role || 'Main Duelist (Iso / Jett)');
    setUserBio(currentUser.bio || '');
  }, [currentUser]);

  // Handle Username Change (7 Gün Cooldown)
  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = newRiotName.trim();
    const cleanTag = (newRiotTag || 'TR1').trim().replace('#', '');
    const combinedId = `${cleanName}#${cleanTag}`;

    if (!cleanName || cleanName.length < 3 || cleanName.length > 16) {
      showToast('Kullanıcı adı 3 ile 16 karakter arasında olmalıdır.', 'error');
      return;
    }

    if (!cleanTag || cleanTag.length < 2 || cleanTag.length > 5) {
      showToast('Etiket (Tag) 2 ile 5 karakter arasında olmalıdır (Örn: TR1).', 'error');
      return;
    }

    if (combinedId.toLowerCase() === currentUser.riotId.toLowerCase()) {
      showToast('Mevcut kullanıcı adınızla aynı bir isim girdiniz.', 'info');
      return;
    }

    // Cooldown check
    if (usernameCooldown.isLocked && !(isAdmin && adminBypass)) {
      showToast(
        `Kullanıcı adınızı 7 günde bir değiştirebilirsiniz. Kalan süre: ${usernameCooldown.formatted} (${usernameCooldown.unlockDateStr})`,
        'error'
      );
      return;
    }

    // Check uniqueness across other registered accounts
    const isTaken = registeredUsers.some(
      (u) =>
        u.email.toLowerCase() !== currentUser.email.toLowerCase() &&
        u.riotId.toLowerCase() === combinedId.toLowerCase()
    );

    if (isTaken) {
      showToast(`"${combinedId}" adı başka bir oyuncu tarafından kullanılıyor. Lütfen farklı bir isim veya etiket seçin.`, 'error');
      return;
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      riotId: combinedId,
      lastUsernameChange: new Date().toISOString(),
    };

    onUpdateUser(
      updatedUser,
      `Kullanıcı adınız başarıyla "${combinedId}" olarak güncellendi! Bir sonraki değişiklik 7 gün sonra yapılabilecektir.`
    );
  };

  // Handle Password Change (3 Gün Cooldown)
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      showToast('Yeni şifreniz en az 6 karakter olmalıdır.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Girdiğiniz şifreler birbiriyle eşleşmiyor.', 'error');
      return;
    }

    // If existing password exists, verify current password
    if (currentUser.password && currentUser.password !== currentPasswordInput && !(isAdmin && adminBypass)) {
      showToast('Mevcut şifrenizi hatalı girdiniz.', 'error');
      return;
    }

    // Cooldown check
    if (passwordCooldown.isLocked && !(isAdmin && adminBypass)) {
      showToast(
        `Şifrenizi 3 günde bir değiştirebilirsiniz. Kalan süre: ${passwordCooldown.formatted} (${passwordCooldown.unlockDateStr})`,
        'error'
      );
      return;
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      password: newPassword,
      lastPasswordChange: new Date().toISOString(),
    };

    onUpdateUser(
      updatedUser,
      'Şifreniz başarıyla güncellendi! Güvenliğiniz için bir sonraki şifre değişimi 3 gün sonra yapılabilecektir.'
    );
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle Email Change (7 Gün Cooldown)
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showToast('Lütfen geçerli bir e-posta adresi giriniz.', 'error');
      return;
    }

    if (cleanEmail === currentUser.email.toLowerCase()) {
      showToast('Mevcut e-posta adresiniz ile aynı.', 'info');
      return;
    }

    // If account has a password, require it for email change
    if (currentUser.password && currentUser.password !== emailConfirmPassword && !(isAdmin && adminBypass)) {
      showToast('E-posta değişikliğini onaylamak için mevcut şifrenizi doğru girmelisiniz.', 'error');
      return;
    }

    // Cooldown check
    if (emailCooldown.isLocked && !(isAdmin && adminBypass)) {
      showToast(
        `E-posta adresinizi 7 günde bir değiştirebilirsiniz. Kalan süre: ${emailCooldown.formatted} (${emailCooldown.unlockDateStr})`,
        'error'
      );
      return;
    }

    // Check if new email is already taken
    const isTaken = registeredUsers.some(
      (u) =>
        u.email.toLowerCase() === cleanEmail &&
        u.email.toLowerCase() !== currentUser.email.toLowerCase()
    );

    if (isTaken) {
      showToast('Bu e-posta adresi ile zaten kayıtlı bir hesap bulunmaktadır.', 'error');
      return;
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      email: cleanEmail,
      lastEmailChange: new Date().toISOString(),
    };

    onUpdateUser(
      updatedUser,
      `E-posta adresiniz "${cleanEmail}" olarak güncellendi! Bir sonraki e-posta değişimi 7 gün sonra yapılabilecektir.`
    );
    setEmailConfirmPassword('');
  };

  // Handle Profile Preferences (Rank, Role, Bio - no strict cooldown)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser: UserAccount = {
      ...currentUser,
      rank: selectedRank,
      role: selectedRole,
      bio: userBio.trim(),
    };

    onUpdateUser(updatedUser, 'Valorant profil tercihleriniz başarıyla kaydedildi!');
  };

  // Handle Sound & Notification Preferences
  const handleSaveSoundSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.saveSettings(soundConfig);
    showToast('Lobi ses ve bildirim tercihleriniz başarıyla kaydedildi!', 'success');
  };

  // Admin testing helper: resets all cooldowns
  const handleResetCooldowns = () => {
    const updatedUser: UserAccount = {
      ...currentUser,
      lastUsernameChange: undefined,
      lastPasswordChange: undefined,
      lastEmailChange: undefined,
    };
    onUpdateUser(updatedUser, 'Yönetici yetkisiyle tüm bekleme süreleri (cooldown) sıfırlandı!');
  };

  // Admin testing helper: simulates cooldown (locks all fields)
  const handleSimulateCooldown = () => {
    // 2 days ago (username and email still have 5 days left, password has 1 day left)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const updatedUser: UserAccount = {
      ...currentUser,
      lastUsernameChange: twoDaysAgo,
      lastPasswordChange: twoDaysAgo,
      lastEmailChange: twoDaysAgo,
    };
    onUpdateUser(updatedUser, 'Test amaçlı 2 günlük bekleme süresi uygulandı. Kalan süreleri inceleyebilirsiniz.');
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1220] via-[#141c2e] to-[#0c1220] border border-white/10 p-6 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#7000ff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#7000ff]/20 border border-[#7000ff]/40 flex items-center justify-center text-[#c084fc] shadow-[0_0_20px_rgba(112,0,255,0.3)]">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-rajdhani font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
                  Hesap ve Güvenlik Ayarları
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 uppercase tracking-wider">
                    Admin Yetkisi
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Riot ID, şifre ve e-posta değişiklikleri hesap güvenliği amacıyla süreli kural protokollerine tabidir.
              </p>
            </div>
          </div>

          {/* Cooldown Summary Badges */}
          <div className="flex flex-wrap gap-2 text-xs font-rajdhani font-bold">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              usernameCooldown.isLocked
                ? 'bg-[#ff4655]/15 border-[#ff4655]/40 text-[#ff4655]'
                : 'bg-[#00b894]/15 border-[#00b894]/40 text-[#00b894]'
            }`}>
              <User className="w-3.5 h-3.5" />
              <span>İsim: {usernameCooldown.isLocked ? `Kilitli (${usernameCooldown.formatted})` : '7 Gün Kuralı (Açık)'}</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              passwordCooldown.isLocked
                ? 'bg-[#f59e0b]/15 border-[#f59e0b]/40 text-[#f59e0b]'
                : 'bg-[#00b894]/15 border-[#00b894]/40 text-[#00b894]'
            }`}>
              <KeyRound className="w-3.5 h-3.5" />
              <span>Şifre: {passwordCooldown.isLocked ? `Kilitli (${passwordCooldown.formatted})` : '3 Gün Kuralı (Açık)'}</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              emailCooldown.isLocked
                ? 'bg-[#a855f7]/15 border-[#a855f7]/40 text-[#a855f7]'
                : 'bg-[#00b894]/15 border-[#00b894]/40 text-[#00b894]'
            }`}>
              <Mail className="w-3.5 h-3.5" />
              <span>E-posta: {emailCooldown.isLocked ? `Kilitli (${emailCooldown.formatted})` : '7 Gün Kuralı (Açık)'}</span>
            </div>
          </div>
        </div>

        {/* Admin Testing Strip */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Shield className="w-4 h-4 text-[#f59e0b]" />
              <span className="font-bold text-[#f59e0b]">YÖNETİCİ TEST KONTROLÜ:</span>
              <label className="flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <input
                  type="checkbox"
                  checked={adminBypass}
                  onChange={(e) => setAdminBypass(e.target.checked)}
                  className="rounded text-[#f59e0b] focus:ring-0 cursor-pointer"
                />
                <span className="text-zinc-200">Bekleme Sürelerini Yoksay (Bypass)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCooldowns}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00b894]/20 hover:bg-[#00b894]/30 text-[#00b894] border border-[#00b894]/40 transition-colors cursor-pointer"
                title="Tüm kilitleri kaldırıp süreyi sıfırlar"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Süreleri Sıfırla (Kilitleri Aç)</span>
              </button>
              <button
                type="button"
                onClick={handleSimulateCooldown}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ff4655]/20 hover:bg-[#ff4655]/30 text-[#ff4655] border border-[#ff4655]/40 transition-colors cursor-pointer"
                title="Kalan gün sayacı görünümünü test eder"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Test Kilit Süresi Uygula</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveSubTab('username')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            activeSubTab === 'username'
              ? 'bg-[#7000ff] text-white border-[#7000ff] shadow-[0_0_15px_rgba(112,0,255,0.4)]'
              : 'bg-[#0f172a]/70 hover:bg-[#1e293b] text-zinc-400 hover:text-white border-white/5'
          }`}
        >
          <User className="w-4 h-4 text-[#c084fc]" />
          <span>Kullanıcı Adı (7 Gün)</span>
          {usernameCooldown.isLocked && <Lock className="w-3.5 h-3.5 text-[#f59e0b]" />}
        </button>

        <button
          onClick={() => setActiveSubTab('password')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            activeSubTab === 'password'
              ? 'bg-[#ff4655] text-white border-[#ff4655] shadow-[0_0_15px_rgba(255,70,85,0.4)]'
              : 'bg-[#0f172a]/70 hover:bg-[#1e293b] text-zinc-400 hover:text-white border-white/5'
          }`}
        >
          <KeyRound className="w-4 h-4 text-[#ff7979]" />
          <span>Şifre (3 Gün)</span>
          {passwordCooldown.isLocked && <Lock className="w-3.5 h-3.5 text-[#f59e0b]" />}
        </button>

        <button
          onClick={() => setActiveSubTab('email')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            activeSubTab === 'email'
              ? 'bg-[#00b894] text-white border-[#00b894] shadow-[0_0_15px_rgba(0,184,148,0.4)]'
              : 'bg-[#0f172a]/70 hover:bg-[#1e293b] text-zinc-400 hover:text-white border-white/5'
          }`}
        >
          <Mail className="w-4 h-4 text-[#55efc4]" />
          <span>E-posta (7 Gün)</span>
          {emailCooldown.isLocked && <Lock className="w-3.5 h-3.5 text-[#f59e0b]" />}
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            activeSubTab === 'profile'
              ? 'bg-[#f59e0b] text-black border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.4)] font-black'
              : 'bg-[#0f172a]/70 hover:bg-[#1e293b] text-zinc-400 hover:text-white border-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#f59e0b]" />
          <span>Profil & Rank</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audio')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            activeSubTab === 'audio'
              ? 'bg-[#0984e3] text-white border-[#0984e3] shadow-[0_0_15px_rgba(9,132,227,0.4)]'
              : 'bg-[#0f172a]/70 hover:bg-[#1e293b] text-zinc-400 hover:text-white border-white/5'
          }`}
        >
          {soundConfig.isMuted ? (
            <VolumeX className="w-4 h-4 text-zinc-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#74b9ff]" />
          )}
          <span>Lobi Sesleri</span>
        </button>
      </div>

      {/* TAB CONTENT 1: USERNAME (7 DAYS COOLDOWN) */}
      {activeSubTab === 'username' && (
        <div className="bg-[#0c1220]/90 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <h2 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-5 h-5 text-[#a855f7]" /> Kullanıcı Adı & Riot ID Değişikliği
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Riot ID kuralı gereğince kullanıcı adınızı <strong>en fazla 7 günde bir</strong> değiştirebilirsiniz.
              </p>
            </div>

            {/* Status Pill */}
            {usernameCooldown.isLocked ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/40 text-[#ff4655] text-xs font-rajdhani font-bold">
                <Lock className="w-4 h-4 animate-pulse" />
                <div>
                  <div>KİLİTLİ: Kalan Süre {usernameCooldown.formatted}</div>
                  <div className="text-[10px] text-zinc-400 font-sans font-normal">
                    Sonraki değişim: {usernameCooldown.unlockDateStr}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00b894]/15 border border-[#00b894]/40 text-[#00b894] text-xs font-rajdhani font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <div>
                  <div>HEMEN DEĞİŞTİRİLEBİLİR</div>
                  <div className="text-[10px] text-zinc-400 font-sans font-normal">
                    7 günlük bekleme süresi doldu
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveUsername} className="mt-6 space-y-6 max-w-2xl">
            {/* Current Username Info */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 block">Şu Anki Riot ID:</span>
                <span className="font-rajdhani font-bold text-lg text-white">
                  {currentUser.riotId}
                </span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {currentUser.lastUsernameChange
                  ? `Son Değişim: ${new Date(currentUser.lastUsernameChange).toLocaleDateString('tr-TR')}`
                  : 'Henüz Değiştirilmedi'}
              </span>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Yeni Kullanıcı Adı (3-16 Karakter) *
                </label>
                <input
                  type="text"
                  value={newRiotName}
                  onChange={(e) => setNewRiotName(e.target.value)}
                  disabled={usernameCooldown.isLocked && !(isAdmin && adminBypass)}
                  placeholder="Örn: IsoSlayer"
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#7000ff] text-sm disabled:opacity-50 disabled:cursor-not-allowed font-rajdhani font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Etiket (Tag) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold font-rajdhani">#</span>
                  <input
                    type="text"
                    value={newRiotTag}
                    onChange={(e) => setNewRiotTag(e.target.value.replace('#', ''))}
                    disabled={usernameCooldown.isLocked && !(isAdmin && adminBypass)}
                    placeholder="TR1"
                    maxLength={5}
                    className="w-full bg-[#141c2e] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#7000ff] text-sm disabled:opacity-50 disabled:cursor-not-allowed font-rajdhani font-bold text-base uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Rule Notice */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#7000ff]/10 border border-[#7000ff]/20 text-xs text-zinc-300">
              <AlertTriangle className="w-4 h-4 text-[#a855f7] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Önemli Bilgilendirme:</strong> Kullanıcı adınızı değiştirdiğinizde, sistem bunu onaylar ve yeni adınız tüm scrim lobilerinde, takım ilanlarında ve arkadaş listenizde anında güncellenir. Bir sonraki değişim için <strong>7 gün (168 saat)</strong> beklemeniz gerekecektir.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={usernameCooldown.isLocked && !(isAdmin && adminBypass)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#ff4655] hover:from-[#8014ff] hover:to-[#ff5c6a] text-white font-rajdhani font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(112,0,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Kullanıcı Adını Değiştir (7 Gün Kuralı)</span>
              </button>

              {isAdmin && adminBypass && (
                <span className="text-xs text-[#f59e0b] font-bold">
                  (Yönetici Muafiyeti Aktif)
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT 2: PASSWORD (3 DAYS COOLDOWN) */}
      {activeSubTab === 'password' && (
        <div className="bg-[#0c1220]/90 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <h2 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#ff4655]" /> Güvenlik & Şifre Değişikliği
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Hesap güvenliği protokolü gereğince şifrenizi <strong>en fazla 3 günde bir</strong> değiştirebilirsiniz.
              </p>
            </div>

            {/* Status Pill */}
            {passwordCooldown.isLocked ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/40 text-[#ff4655] text-xs font-rajdhani font-bold">
                <Lock className="w-4 h-4 animate-pulse" />
                <div>
                  <div>KİLİTLİ: Kalan Süre {passwordCooldown.formatted}</div>
                  <div className="text-[10px] text-zinc-400 font-sans font-normal">
                    Sonraki değişim: {passwordCooldown.unlockDateStr}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00b894]/15 border border-[#00b894]/40 text-[#00b894] text-xs font-rajdhani font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <div>
                  <div>HEMEN DEĞİŞTİRİLEBİLİR</div>
                  <div className="text-[10px] text-zinc-400 font-sans font-normal">
                    3 günlük bekleme süresi doldu
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSavePassword} className="mt-6 space-y-6 max-w-xl">
            {/* If user currently has a password, ask for current password */}
            {currentUser.password && (
              <div>
                <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Mevcut Şifreniz *
                </label>
                <input
                  type="password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  disabled={passwordCooldown.isLocked && !(isAdmin && adminBypass)}
                  placeholder="••••••••"
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4655] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300">
                  Yeni Şifre (En az 6 karakter) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showNewPass ? 'Gizle' : 'Göster'}</span>
                </button>
              </div>
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordCooldown.isLocked && !(isAdmin && adminBypass)}
                placeholder="Yeni güçlü şifreniz"
                className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4655] text-sm disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Yeni Şifre Tekrar *
              </label>
              <input
                type={showNewPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={passwordCooldown.isLocked && !(isAdmin && adminBypass)}
                placeholder="Yeni şifrenizi tekrar giriniz"
                className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4655] text-sm disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              />
            </div>

            {/* Password match indicator */}
            {newPassword && confirmPassword && (
              <div className="text-xs flex items-center gap-1.5">
                {newPassword === confirmPassword ? (
                  <span className="text-[#00b894] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Şifreler eşleşiyor
                  </span>
                ) : (
                  <span className="text-[#ff4655] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Şifreler henüz eşleşmiyor
                  </span>
                )}
              </div>
            )}

            {/* Rule Notice */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#ff4655]/10 border border-[#ff4655]/20 text-xs text-zinc-300">
              <Clock className="w-4 h-4 text-[#ff4655] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">3 Günlük Güvenlik Kuralı:</strong> Şifrenizi başarıyla değiştirdikten sonra, hesabınızın ele geçirilme risklerine karşı kilitlenerek <strong>3 gün (72 saat)</strong> boyunca yeni bir şifre değişikliğine izin verilmeyecektir.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordCooldown.isLocked && !(isAdmin && adminBypass)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4655] to-[#7000ff] hover:opacity-90 text-white font-rajdhani font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(255,70,85,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Şifreyi Güncelle (3 Gün Kuralı)</span>
              </button>

              {isAdmin && adminBypass && (
                <span className="text-xs text-[#f59e0b] font-bold">
                  (Yönetici Muafiyeti Aktif)
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT 3: EMAIL (7 DAYS COOLDOWN) */}
      {activeSubTab === 'email' && (
        <div className="bg-[#0c1220]/90 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <h2 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#00b894]" /> E-posta Adresi Değişikliği
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Hesap kurtarma ve güvenlik amacıyla e-posta adresinizi <strong>en fazla 7 günde bir</strong> değiştirebilirsiniz.
              </p>
            </div>

            {/* Status Pill */}
            {emailCooldown.isLocked ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/40 text-[#ff4655] text-xs font-rajdhani font-bold">
                <Lock className="w-4 h-4 animate-pulse" />
                <div>
                  <div>KİLİTLİ: Kalan Süre {emailCooldown.formatted}</div>
                  <div className="text-[10px] text-zinc-400 font-sans font-normal">
                    Sonraki değişim: {emailCooldown.unlockDateStr}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00b894]/15 border border-[#00b894]/40 text-[#00b894] text-xs font-rajdhani font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <div>
                  <div>HEMEN DEĞİŞTİRİLEBİLİR</div>
                  <div className="text-[10px] text-zinc-400 font-sans font-normal">
                    7 günlük bekleme süresi doldu
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveEmail} className="mt-6 space-y-6 max-w-xl">
            {/* Current Email */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 block">Şu Anki E-posta:</span>
                <span className="font-mono font-bold text-base text-white">
                  {currentUser.email}
                </span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {currentUser.lastEmailChange
                  ? `Son Değişim: ${new Date(currentUser.lastEmailChange).toLocaleDateString('tr-TR')}`
                  : 'İlk Kayıt'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Yeni E-posta Adresi *
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={emailCooldown.isLocked && !(isAdmin && adminBypass)}
                placeholder="yeni.eposta@ornek.com"
                className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00b894] text-sm disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              />
            </div>

            {/* Confirm with password if account has one */}
            {currentUser.password && (
              <div>
                <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Güvenlik Doğrulaması: Mevcut Şifreniz *
                </label>
                <input
                  type="password"
                  value={emailConfirmPassword}
                  onChange={(e) => setEmailConfirmPassword(e.target.value)}
                  disabled={emailCooldown.isLocked && !(isAdmin && adminBypass)}
                  placeholder="E-posta değişikliği için mevcut şifrenizi girin"
                  className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00b894] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Rule Notice */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#00b894]/10 border border-[#00b894]/20 text-xs text-zinc-300">
              <Clock className="w-4 h-4 text-[#00b894] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">7 Günlük Güvenlik Kuralı:</strong> E-posta adresinizi değiştirdiğinizde tüm lobi bildirimleri ve hesap girişiniz yeni e-postanıza taşınır. Bir sonraki e-posta güncellemesi için <strong>7 gün</strong> beklemeniz gerekecektir.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={emailCooldown.isLocked && !(isAdmin && adminBypass)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00b894] to-[#0984e3] hover:opacity-90 text-white font-rajdhani font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(0,184,148,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>E-posta Adresini Güncelle (7 Gün Kuralı)</span>
              </button>

              {isAdmin && adminBypass && (
                <span className="text-xs text-[#f59e0b] font-bold">
                  (Yönetici Muafiyeti Aktif)
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT 4: PROFILE PREFERENCES (RANK & ROLE - NO STRICT COOLDOWN) */}
      {activeSubTab === 'profile' && (
        <div className="bg-[#0c1220]/90 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="pb-6 border-b border-white/10">
            <h2 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f59e0b]" /> Valorant Oyun Tercihleri ve Rank
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Rank ve rol tercihlerinizi dilediğiniz zaman güncelleyebilirsiniz. Scrim lobileri ve takım aramalarında bu bilgiler gösterilir.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-6 space-y-6 max-w-2xl">
            {/* Rank Select */}
            <div>
              <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Mevcut Valorant Dereceniz (Rank) *
              </label>
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f59e0b] text-sm font-rajdhani font-bold text-base cursor-pointer"
              >
                {VALORANT_RANKS.map((r) => (
                  <option key={r} value={r} className="bg-[#0c1220] text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Select */}
            <div>
              <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Ana Rol & Ajan Tercihiniz *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f59e0b] text-sm font-rajdhani font-bold text-base cursor-pointer"
              >
                {VALORANT_ROLES.map((role) => (
                  <option key={role} value={role} className="bg-[#0c1220] text-white">
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-rajdhani font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Hakkında & Oyun Tarzı (Biyografi)
              </label>
              <textarea
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                rows={3}
                placeholder="Örn: Hafta içi akşamları scrim atabilirim, turnuva tecrübem var..."
                className="w-full bg-[#141c2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#f59e0b] text-sm"
              />
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:opacity-90 text-black font-rajdhani font-black uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Profil Tercihlerini Kaydet</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT 5: LOBBY AUDIO & NOTIFICATION SETTINGS */}
      {activeSubTab === 'audio' && (
        <div className="bg-[#0c1220]/90 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <h2 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-[#0984e3]" /> Lobi İçi Ses & Bildirim Efektleri
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                Arkadaşlık istekleri ve yeni gelen DM mesajları için lobi bildirim seslerini özelleştirin ve canlı test edin.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  soundConfig.isMuted
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    : 'bg-[#0984e3]/20 text-[#74b9ff] border-[#0984e3]/40'
                }`}
              >
                {soundConfig.isMuted ? 'SESLER KAPALI (MUTE)' : 'SESLER AKTİF'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveSoundSettings} className="mt-6 space-y-6">
            {/* Master Volume Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#141c2e] border border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    soundConfig.isMuted
                      ? 'bg-zinc-800 text-zinc-500'
                      : 'bg-[#0984e3]/20 text-[#74b9ff]'
                  }`}
                >
                  {soundConfig.isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-rajdhani font-bold text-white uppercase">
                    Genel Lobi Sesleri (Master Switch)
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Açık olduğunda tüm bildirim sesleri Web Audio API ile gecikmesiz olarak çalınır.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newMuted = !soundConfig.isMuted;
                  const updated = { ...soundConfig, isMuted: newMuted };
                  setSoundConfig(updated);
                  soundManager.saveSettings(updated);
                  if (!newMuted) {
                    soundManager.playMessageSound();
                  }
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !soundConfig.isMuted ? 'bg-[#0984e3]' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    !soundConfig.isMuted ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Friend Request Sound Toggle & Test */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#141c2e] border border-white/10 gap-4 transition-opacity ${
                soundConfig.isMuted ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7000ff]/20 text-[#a855f7] flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-rajdhani font-bold text-white uppercase">
                    Arkadaşlık İsteği Bildirim Sesi
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Yeni bir arkadaşlık isteği gönderildiğinde veya size ulaştığında taktiksel ses çalar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => soundManager.playFriendRequestSound()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-rajdhani font-bold uppercase transition-all cursor-pointer"
                  title="Arkadaşlık isteği sesini test et"
                >
                  <Play className="w-3.5 h-3.5 text-[#a855f7]" />
                  <span>Sesi Test Et</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...soundConfig,
                      friendRequestSoundEnabled: !soundConfig.friendRequestSoundEnabled,
                    };
                    setSoundConfig(updated);
                    soundManager.saveSettings(updated);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundConfig.friendRequestSoundEnabled && !soundConfig.isMuted
                      ? 'bg-[#7000ff]'
                      : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      soundConfig.friendRequestSoundEnabled && !soundConfig.isMuted
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* DM Message Sound Toggle & Test */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#141c2e] border border-white/10 gap-4 transition-opacity ${
                soundConfig.isMuted ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00b894]/20 text-[#55efc4] flex items-center justify-center shrink-0">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-rajdhani font-bold text-white uppercase">
                    Yeni DM Mesajı Bildirim Sesi
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Birebir sohbette arkadaşınızdan yeni bir mesaj geldiğinde veya mesaj gönderildiğinde çalar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => soundManager.playMessageSound()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-rajdhani font-bold uppercase transition-all cursor-pointer"
                  title="DM mesajı sesini test et"
                >
                  <Play className="w-3.5 h-3.5 text-[#55efc4]" />
                  <span>Sesi Test Et</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...soundConfig,
                      messageSoundEnabled: !soundConfig.messageSoundEnabled,
                    };
                    setSoundConfig(updated);
                    soundManager.saveSettings(updated);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundConfig.messageSoundEnabled && !soundConfig.isMuted
                      ? 'bg-[#00b894]'
                      : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      soundConfig.messageSoundEnabled && !soundConfig.isMuted
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0984e3] to-[#74b9ff] hover:opacity-90 text-white font-rajdhani font-black uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(9,132,227,0.4)] cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Ses Ayarlarını Kaydet</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
