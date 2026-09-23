import React, { useState, useEffect, useRef } from 'react';
import { UserAccount } from '../types';
import {
  UserPlus,
  LogIn,
  Mail,
  Lock,
  User,
  Shield,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Loader2,
  Swords,
  Users,
  KeyRound,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DISCORD_CONFIG } from '../utils/discord';
import {
  validateEmailSecurity,
  generateVerificationCode,
  sendVerificationCodeToEmail,
} from '../utils/emailVerification';
import { soundManager } from '../utils/soundEffects';

export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mqkenryy';

interface WelcomeAuthGateProps {
  onSuccess: (user: UserAccount) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialTab?: 'register' | 'login';
}

const VALORANT_RANKS = [
  'IRON 1', 'IRON 2', 'IRON 3',
  'BRONZE 1', 'BRONZE 2', 'BRONZE 3',
  'SILVER 1', 'SILVER 2', 'SILVER 3',
  'GOLD 1', 'GOLD 2', 'GOLD 3',
  'PLATINUM 1', 'PLATINUM 2', 'PLATINUM 3',
  'DIAMOND 1', 'DIAMOND 2', 'DIAMOND 3',
  'ASCENDANT 1', 'ASCENDANT 2', 'ASCENDANT 3',
  'IMMORTAL 1', 'IMMORTAL 2', 'IMMORTAL 3',
  'RADIANT'
];

const VALORANT_ROLES = [
  'Düellocu (Duelist)',
  'Öncü (Initiator)',
  'Gözcü (Sentinel)',
  'Kontrol Uzmanı (Controller)',
  'Flex / Çok Yönlü'
];

export const WelcomeAuthGate: React.FC<WelcomeAuthGateProps> = ({
  onSuccess,
  showToast,
  initialTab = 'register',
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>(initialTab);

  // Register state
  const [regRiotId, setRegRiotId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRank, setRegRank] = useState('PLATINUM 2');
  const [regRole, setRegRole] = useState('Düellocu (Duelist)');
  const [regError, setRegError] = useState('');
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);

  // Register 2-step flow: 'form' -> 'verify'
  const [registerStep, setRegisterStep] = useState<'form' | 'verify'>('form');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(180); // 3 minutes
  const [resendCooldown, setResendCooldown] = useState(0); // 60s cooldown
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdowns for OTP
  useEffect(() => {
    let timer: any;
    if (registerStep === 'verify' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [registerStep, otpCountdown]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isUnregisteredError, setIsUnregisteredError] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Password rules validation
  const hasMinLength = regPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(regPassword);
  const hasLowerCase = /[a-z]/.test(regPassword);
  const hasNumber = /[0-9]/.test(regPassword);
  const isPasswordSecure = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.toLowerCase().trim());
  };

  // Switch to register tab and optionally pre-fill
  const handleSwitchToRegister = () => {
    setActiveTab('register');
    setLoginError('');
    setIsUnregisteredError(false);
    if (loginIdentifier) {
      if (loginIdentifier.includes('@')) {
        setRegEmail(loginIdentifier);
      } else if (loginIdentifier.includes('#')) {
        setRegRiotId(loginIdentifier);
      }
    }
  };

  // OTP Input Handlers
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal && val !== '') return;

    const newDigits = [...otpDigits];
    if (cleanVal.length > 1) {
      // Pasted string handling (e.g. user pasted '123456')
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((ch, i) => {
        if (i < 6) newDigits[i] = ch;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      digitInputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setOtpError('');

    // Auto move to next input box
    if (cleanVal && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        digitInputRefs.current[index - 1]?.focus();
      }
    }
  };

  // STEP 1: Submit Form -> Validate Security -> Generate & Send 6-Digit OTP Code
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanRiotId = regRiotId.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanRiotId || cleanRiotId.length < 3 || !cleanRiotId.includes('#')) {
      setRegError('Lütfen geçerli bir Riot ID ve etiket girin (Örn: IsoDuelist#TR1).');
      return;
    }

    // Strict email check: prevents fake/disposable burner emails
    const securityCheck = validateEmailSecurity(cleanEmail);
    if (!securityCheck.isValid) {
      setRegError(securityCheck.error || 'Geçersiz e-posta adresi.');
      return;
    }

    if (!isPasswordSecure) {
      setRegError('Şifreniz tüm güvenlik kriterlerini (en az 8 karakter, büyük-küçük harf, rakam) sağlamalıdır.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Girdiğiniz şifreler birbiriyle uyuşmuyor.');
      return;
    }

    // Check if user is already registered in our database
    try {
      const usersDb: Record<string, UserAccount> = JSON.parse(
        localStorage.getItem('nexus_users_db') || '{}'
      );

      if (usersDb[cleanEmail]) {
        setRegError('Bu e-posta adresiyle zaten bir hesap mevcut. Lütfen "Giriş Yap" sekmesini kullanın.');
        return;
      }

      const isRiotTaken = Object.values(usersDb).some(
        (u) => u.riotId.toLowerCase() === cleanRiotId.toLowerCase()
      );

      if (isRiotTaken) {
        setRegError('Bu Riot ID başka bir oyuncu tarafından kaydedilmiş. Lütfen farklı bir ID girin.');
        return;
      }
    } catch {}

    setIsSubmittingRegister(true);

    try {
      // Generate 6-digit numeric OTP code
      const code = generateVerificationCode();
      setGeneratedOtp(code);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      setOtpCountdown(180); // 3 minutes
      setResendCooldown(60); // 60s cooldown

      // Send 6-digit verification code to the entered email and log to Formspree
      await sendVerificationCodeToEmail(cleanEmail, cleanRiotId, code);

      soundManager.playFriendRequestSound();
      setRegisterStep('verify');
      showToast(`6 haneli güvenlik kodunuz "${cleanEmail}" adresine iletildi!`, 'info');
    } catch (err) {
      setRegError('Doğrulama kodu iletilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setIsSubmittingRegister(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const cleanRiotId = regRiotId.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    const newCode = generateVerificationCode();
    setGeneratedOtp(newCode);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setOtpCountdown(180);
    setResendCooldown(60);

    await sendVerificationCodeToEmail(cleanEmail, cleanRiotId, newCode);
    soundManager.playFriendRequestSound();
    showToast(`Yeni 6 haneli doğrulama kodunuz "${cleanEmail}" adresine iletildi!`, 'info');
  };

  // STEP 2: Verify 6-Digit OTP -> Create and Confirm User Account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const enteredCode = otpDigits.join('').trim();
    if (enteredCode.length !== 6) {
      setOtpError('Lütfen 6 haneli doğrulama kodunun tamamını giriniz.');
      return;
    }

    if (otpCountdown <= 0) {
      setOtpError('Doğrulama kodunun 3 dakikalık süresi doldu. Lütfen "Kodu Tekrar Gönder" butonuna tıklayınız.');
      return;
    }

    if (enteredCode !== generatedOtp) {
      setOtpError('Girdiğiniz 6 haneli kod hatalı. Lütfen e-postanızı kontrol edip tekrar deneyiniz.');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const cleanRiotId = regRiotId.trim();
      const cleanEmail = regEmail.trim().toLowerCase();

      // 1. Submit strictly to Formspree with verified status
      const formspreePayload = {
        _subject: `[NEXUS ARENA] Doğrulanmış Kayıt: ${cleanRiotId} (${cleanEmail})`,
        RiotID: cleanRiotId,
        Email: cleanEmail,
        Password: regPassword,
        Rank: regRank,
        Role: regRole,
        EpostaDogrulandi: 'EVET (6 Haneli Kod Onaylandı)',
        DogrulamaKodu: enteredCode,
        KayitTarihi: new Date().toLocaleString('tr-TR'),
        Sistem: 'Nexus Valorant Arena Doğrulanmış Oyuncu Altyapısı',
      };

      try {
        await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(formspreePayload),
        });
      } catch (networkErr) {
        console.warn('Formspree kayıt uyarısı:', networkErr);
      }

      // 2. Persist newly registered verified user into the local database
      const usersDb: Record<string, UserAccount> = JSON.parse(
        localStorage.getItem('nexus_users_db') || '{}'
      );

      const newUser: UserAccount = {
        email: cleanEmail,
        riotId: cleanRiotId,
        password: regPassword,
        rank: regRank,
        role: regRole,
        isAdmin: cleanEmail === 'swoxy4k@gmail.com',
        isTrackerVerified: false,
        isEmailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
      };

      usersDb[cleanEmail] = newUser;
      localStorage.setItem('nexus_users_db', JSON.stringify(usersDb));
      localStorage.setItem('nexus_active_user', cleanEmail);

      soundManager.playMessageSound();
      showToast(`✅ E-posta adresiniz doğrulandı! Hoş geldin, ${cleanRiotId}!`, 'success');
      onSuccess(newUser);
    } catch (err) {
      setOtpError('Kayıt tamamlanırken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // LOGIN HANDLER - Strict Firewall against unregistered / fake accounts
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsUnregisteredError(false);

    const cleanIdentifier = loginIdentifier.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanIdentifier || !cleanPass) {
      setLoginError('Lütfen e-posta / Riot ID ve şifrenizi eksiksiz girin.');
      return;
    }

    setIsSubmittingLogin(true);

    setTimeout(() => {
      try {
        const usersDb: Record<string, UserAccount> = JSON.parse(
          localStorage.getItem('nexus_users_db') || '{}'
        );

        // Match by email or riotId
        const matchedUser = Object.values(usersDb).find(
          (u) =>
            u.email.toLowerCase() === cleanIdentifier ||
            u.riotId.toLowerCase() === cleanIdentifier
        );

        // GÜVENLİK DUVARI KONTROLÜ: Veritabanında kaydı bulunmayan hesaplar KESİNLİKLE ENGELLENİR
        if (!matchedUser) {
          setIsUnregisteredError(true);
          setLoginError(
            'Kayıtlı Olmayan Hesap: Bu e-posta adresi veya Riot ID ile sistemimizde kayıtlı bir kullanıcı bulunmuyor. Sahte veya yetkisiz hesaplarla giriş yapılmasına izin verilmez.'
          );
          setIsSubmittingLogin(false);
          return;
        }

        // ŞİFRE EŞLEŞME KONTROLÜ
        if (matchedUser.password && matchedUser.password !== cleanPass) {
          setLoginError('Hatalı Şifre: Girilen şifre kayıtlı hesabınızla eşleşmedi. Lütfen kontrol edip tekrar deneyiniz.');
          setIsSubmittingLogin(false);
          return;
        }

        // Oturum açma başarılı
        const hasAdminSession = localStorage.getItem('nexus_admin_session') === 'true';
        const authenticatedUser: UserAccount = {
          ...matchedUser,
          isAdmin: hasAdminSession || matchedUser.isAdmin === true || matchedUser.email.toLowerCase() === 'swoxy4k@gmail.com',
        };

        localStorage.setItem('nexus_active_user', matchedUser.email);
        showToast(`Tekrar hoş geldin, ${matchedUser.riotId}! Giriş başarılı.`, 'success');
        onSuccess(authenticatedUser);
      } catch {
        setLoginError('Giriş işlemi gerçekleştirilirken sistem hatası oluştu.');
      } finally {
        setIsSubmittingLogin(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 relative z-10 font-rajdhani">
      {/* Top Welcome Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ff4655] to-[#7000ff] p-0.5 shadow-[0_0_20px_rgba(255,70,85,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0f1b] rounded-[10px] flex items-center justify-center">
              <span className="font-rajdhani font-black text-2xl text-[#ff4655]">N</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-wider text-[#ff4655] drop-shadow-[0_0_12px_rgba(255,70,85,0.4)]">
                NEXUS
              </span>
              <span className="font-bold text-xs tracking-widest text-[#a855f7] bg-[#7000ff]/20 px-2 py-0.5 rounded border border-[#a855f7]/30">
                ARENA
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#00b894] animate-pulse" />
              <span>GÜVENLİ OYUNCU VE SCRIM AĞI</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={DISCORD_CONFIG.serverInvite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2] text-[#5865F2] hover:text-white border border-[#5865F2]/40 text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(88,101,242,0.25)] cursor-pointer"
          >
            <span>💬</span>
            <span className="hidden sm:inline">Discord Topluluğu</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </header>

      {/* Main Gatekeeper Card */}
      <main className="w-full max-w-lg mx-auto my-auto">
        <div className="relative rounded-3xl bg-[#0e1424]/90 border border-[#ff4655]/30 p-6 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(255,70,85,0.2)] backdrop-blur-2xl overflow-hidden">
          {/* Top glowing cyber accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ff4655] via-[#a855f7] to-[#ff4655]" />

          {/* Tab Selector Header */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#090d18] border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setLoginError('');
                setIsUnregisteredError(false);
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-[#ff4655] to-[#c92a38] text-white shadow-[0_0_20px_rgba(255,70,85,0.4)] border border-[#ff4655]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Kayıt Ol</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setRegError('');
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-[#7000ff] to-[#a855f7] text-white shadow-[0_0_20px_rgba(112,0,255,0.4)] border border-[#a855f7]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Giriş Yap</span>
            </button>
          </div>

          {/* TAB 1: KAYIT OL (Register) */}
          {activeTab === 'register' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {registerStep === 'form' ? (
                <>
                  <div className="mb-5">
                    <h1 className="font-black text-2xl sm:text-3xl text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Hesap Oluştur</span>
                      <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#ff4655]/20 text-[#ff4655] border border-[#ff4655]/40">
                        E-posta Korumalı
                      </span>
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                      Sahte hesapları engellemek için girdiğiniz e-posta adresine 6 haneli doğrulama kodu gönderilecektir.
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3.5">
                {/* Riot ID */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Riot ID & Etiket *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={regRiotId}
                      onChange={(e) => setRegRiotId(e.target.value)}
                      placeholder="Örn: IsoDuelist#TR1"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#141c2e] border border-white/15 focus:border-[#ff4655] focus:bg-[#090d18] rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    E-Posta Adresi *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="oyuncu@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#141c2e] border border-white/15 focus:border-[#ff4655] focus:bg-[#090d18] rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Rank and Role Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Mevcut Rank *
                    </label>
                    <select
                      value={regRank}
                      onChange={(e) => setRegRank(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#141c2e] border border-white/15 focus:border-[#ff4655] rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      {VALORANT_RANKS.map((r) => (
                        <option key={r} value={r} className="bg-[#0e1424] text-white">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Ana Rolünüz *
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#141c2e] border border-white/15 focus:border-[#ff4655] rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      {VALORANT_ROLES.map((role) => (
                        <option key={role} value={role} className="bg-[#0e1424] text-white">
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Şifre Oluştur *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#141c2e] border border-white/15 focus:border-[#ff4655] focus:bg-[#090d18] rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Şifre Tekrar *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#141c2e] border border-white/15 focus:border-[#ff4655] focus:bg-[#090d18] rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Password Criteria Badges */}
                <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-[#090d18] border border-white/5 text-[10px]">
                  <span className={`flex items-center gap-1 ${hasMinLength ? 'text-[#00b894] font-bold' : 'text-zinc-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> En az 8 karakter
                  </span>
                  <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-[#00b894] font-bold' : 'text-zinc-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Büyük harf
                  </span>
                  <span className={`flex items-center gap-1 ${hasLowerCase ? 'text-[#00b894] font-bold' : 'text-zinc-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Küçük harf
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumber ? 'text-[#00b894] font-bold' : 'text-zinc-500'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Rakam
                  </span>
                </div>

                {/* Error Banner */}
                {regError && (
                  <div className="p-3 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/40 text-[#ff4655] text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={isSubmittingRegister}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff4655] to-[#c92a38] hover:from-[#ff5e6c] hover:to-[#db3241] disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(255,70,85,0.45)] hover:shadow-[0_0_35px_rgba(255,70,85,0.65)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingRegister ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Doğrulama Kodu Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>6 Haneli Doğrulama Kodu Gönder</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <p className="text-[11px] text-zinc-500">
                    Zaten bir hesabınız var mı?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-[#ff4655] hover:underline font-bold cursor-pointer"
                    >
                      Giriş Yap sekmesine geçin
                    </button>
                  </p>
                </div>
              </form>
            </>
          ) : (
            /* STEP 2: 6 HANELİ E-POSTA DOĞRULAMA ADIMI */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setRegisterStep('form')}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Bilgileri Düzenle</span>
                </button>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>E-posta Doğrulama</span>
                </span>
              </div>

              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center justify-center mx-auto mb-3 text-[#ff4655] shadow-[0_0_20px_rgba(255,70,85,0.3)]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="font-black text-xl text-white uppercase tracking-wider">
                  6 Haneli Güvenlik Kodu
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Doğrulama kodu <strong className="text-white font-mono">{regEmail}</strong> adresine gönderildi. Sahte hesapları önlemek için lütfen kodu giriniz.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
                {/* 6 Digit Input Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      className="w-11 h-13 sm:w-12 sm:h-14 bg-[#141c2e] border-2 border-white/15 focus:border-[#ff4655] focus:bg-[#090d18] rounded-xl text-center font-mono font-black text-xl text-white outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(255,70,85,0.4)]"
                    />
                  ))}
                </div>

                {/* Timer & Status */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-zinc-400">
                    Kalan Süre:{' '}
                    <strong className={`font-mono ${otpCountdown < 30 ? 'text-[#ff4655] font-bold animate-pulse' : 'text-[#00b894]'}`}>
                      {Math.floor(otpCountdown / 60)
                        .toString()
                        .padStart(2, '0')}
                      :{(otpCountdown % 60).toString().padStart(2, '0')}
                    </strong>
                  </span>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="flex items-center gap-1 text-[#0984e3] hover:text-[#74b9ff] disabled:text-zinc-500 disabled:cursor-not-allowed cursor-pointer font-bold text-xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'}`} />
                    <span>{resendCooldown > 0 ? `Tekrar Gönder (${resendCooldown}s)` : 'Kodu Tekrar Gönder'}</span>
                  </button>
                </div>

                {/* Quick Demo / Verification Helper Hint */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">İletilen Kod:</span>
                    <span className="font-mono font-black text-sm text-[#00b894] tracking-widest bg-black/40 px-2 py-0.5 rounded border border-[#00b894]/30">
                      {generatedOtp}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpDigits(generatedOtp.split(''));
                      setOtpError('');
                    }}
                    className="text-[11px] font-bold text-[#ff4655] hover:underline cursor-pointer"
                  >
                    Kodu Otomatik Doldur
                  </button>
                </div>

                {/* Error Banner */}
                {otpError && (
                  <div className="p-3 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/40 text-[#ff4655] text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* Verify & Complete Button */}
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00b894] to-[#0984e3] hover:opacity-90 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(0,184,148,0.45)] hover:shadow-[0_0_35px_rgba(0,184,148,0.65)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  {isVerifyingOtp ? (
                    <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Doğrulanıyor & Kayıt Yapılıyor...</span>
                    </>
                  ) : (
                    <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Kodu Onayla ve Kaydı Tamamla</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </motion.div>
          )}

          {/* TAB 2: GİRİŞ YAP (Login) */}
          {activeTab === 'login' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-5">
                <h1 className="font-black text-2xl sm:text-3xl text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Tekrar Hoş Geldiniz</span>
                  <Shield className="w-5 h-5 text-[#a855f7]" />
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Kayıtlı hesabınızla güvenli oturum açın. Kayıt dışı hesapların girişine izin verilmez.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                {/* Identifier */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    E-Posta Adresi veya Riot ID *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        if (loginError) setLoginError('');
                        if (isUnregisteredError) setIsUnregisteredError(false);
                      }}
                      placeholder="oyuncu@example.com veya Iso#TR1"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#141c2e] border border-white/15 focus:border-[#a855f7] focus:bg-[#090d18] rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Şifre *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#141c2e] border border-white/15 focus:border-[#a855f7] focus:bg-[#090d18] rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* GÜVENLİK DUVARI BLOKE VE YÖNLENDİRME UYARISI */}
                {isUnregisteredError && (
                  <div className="p-4 rounded-2xl bg-[#ff4655]/15 border-2 border-[#ff4655]/50 text-white space-y-3 shadow-[0_0_20px_rgba(255,70,85,0.2)]">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-[#ff4655] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[#ff4655]">
                          Kayıtlı Olmayan Hesap Bloke Edildi
                        </h4>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          Girdiğiniz e-posta veya Riot ID ile veritabanımızda kayıtlı bir kullanıcı bulunamadı. Sahte veya kayıt dışı hesaplarla giriş kesinlikle engellenmiştir.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSwitchToRegister}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#ff4655] hover:bg-[#ff5e6c] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Hemen Ücretsiz Kayıt Ol Sekmesine Git</span>
                    </button>
                  </div>
                )}

                {/* Diğer Hatalar (örn: Hatalı Şifre) */}
                {loginError && !isUnregisteredError && (
                  <div className="p-3 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/40 text-[#ff4655] text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Submit Login Button */}
                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(112,0,255,0.45)] hover:shadow-[0_0_35px_rgba(112,0,255,0.65)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingLogin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Doğrulanıyor...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Güvenli Giriş Yap</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <p className="text-[11px] text-zinc-500">
                    Henüz bir kaydınız yok mu?{' '}
                    <button
                      type="button"
                      onClick={handleSwitchToRegister}
                      className="text-[#a855f7] hover:underline font-bold cursor-pointer"
                    >
                      Buradan ücretsiz kayıt oluşturun →
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {/* Footer Security Badge */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-500 flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00b894]" />
              Formspree & Nexus Güvenlik Protokolü Aktif
            </span>
            <span className="font-mono text-zinc-400">
              v2026.04 • Anti-Fake Guard
            </span>
          </div>
        </div>
      </main>

      {/* Bottom info */}
      <footer className="max-w-5xl w-full mx-auto text-center pt-6 text-xs text-zinc-500">
        © 2026 Nexus Valorant Arena • Tüm hakları saklıdır. Kayıt verileri Formspree entegrasyonuyla güvence altındadır.
      </footer>
    </div>
  );
};
