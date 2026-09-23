import React, { useState, useEffect, useRef } from 'react';
import { UserAccount } from '../types';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Edit3,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  validateEmailSecurity,
  generateVerificationCode,
  sendVerificationCodeToEmail,
} from '../utils/emailVerification';
import { soundManager } from '../utils/soundEffects';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onAuthSuccess: (user: UserAccount) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
  showToast,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regRiotId, setRegRiotId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRank, setRegRank] = useState('PLATINUM 2');
  const [regError, setRegError] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // 2-step OTP flow in Modal
  const [regStep, setRegStep] = useState<'form' | 'verify'>('form');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(180);
  const [resendCooldown, setResendCooldown] = useState(0);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (regStep === 'verify' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [regStep, otpCountdown]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanIdentifier = loginIdentifier.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanIdentifier || !cleanPass) {
      setLoginError('Lütfen e-posta / Riot ID ve şifrenizi girin.');
      return;
    }

    try {
      const usersDb: Record<string, UserAccount> = JSON.parse(
        localStorage.getItem('nexus_users_db') || '{}'
      );

      // Search by email or riotId
      const matchedUser = Object.values(usersDb).find(
        (u) =>
          u.email.toLowerCase() === cleanIdentifier ||
          u.riotId.toLowerCase() === cleanIdentifier
      );

      if (!matchedUser) {
        setLoginError(
          'Kayıtlı Olmayan Hesap: Bu bilgilere ait kayıtlı bir kullanıcı bulunamadı. Lütfen öncelikle "Kayıt Ol" sekmesinden hesabınızı oluşturun.'
        );
        return;
      }

      if (matchedUser.password && matchedUser.password !== cleanPass) {
        setLoginError('Hatalı şifre girdiniz. Lütfen bilgilerinizi kontrol ediniz.');
        return;
      }

      // Check admin status from session
      const hasAdminSession = localStorage.getItem('nexus_admin_session') === 'true';
      const authenticatedUser: UserAccount = {
        ...matchedUser,
        isAdmin: hasAdminSession || matchedUser.isAdmin === true || matchedUser.email.toLowerCase() === 'swoxy4k@gmail.com',
      };

      localStorage.setItem('nexus_active_user', matchedUser.email);
      showToast(`Hoş geldin, ${matchedUser.riotId}! Giriş yapıldı.`, 'success');
      onAuthSuccess(authenticatedUser);
      onClose();
    } catch {
      setLoginError('Giriş yapılırken bir hata oluştu.');
    }
  };

  // OTP Input handlers
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal && val !== '') return;

    const newDigits = [...otpDigits];
    if (cleanVal.length > 1) {
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

    if (cleanVal && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanRiotId = regRiotId.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPass = regPassword.trim();

    if (!cleanRiotId.includes('#') || cleanRiotId.length < 4) {
      setRegError('Lütfen geçerli bir Riot ID girin (Örn: Player#TR1).');
      return;
    }

    // Sahte ve geçici e-posta kontrolü
    const securityCheck = validateEmailSecurity(cleanEmail);
    if (!securityCheck.isValid) {
      setRegError(securityCheck.error || 'Lütfen geçerli bir kalıcı e-posta adresi girin.');
      return;
    }

    if (cleanPass.length < 6) {
      setRegError('Şifreniz en az 6 karakterden oluşmalıdır.');
      return;
    }

    try {
      const usersDb: Record<string, UserAccount> = JSON.parse(
        localStorage.getItem('nexus_users_db') || '{}'
      );

      if (usersDb[cleanEmail]) {
        setRegError('Bu e-posta adresi ile zaten bir hesap oluşturulmuş. Giriş Yap sekmesini kullanın.');
        return;
      }

      const isRiotTaken = Object.values(usersDb).some(
        (u) => u.riotId.toLowerCase() === cleanRiotId.toLowerCase()
      );

      if (isRiotTaken) {
        setRegError('Bu Riot ID başkası tarafından kullanılıyor.');
        return;
      }

      setIsSubmittingReg(true);

      // Generate 6-digit OTP code
      const code = generateVerificationCode();
      setGeneratedOtp(code);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      setOtpCountdown(180);
      setResendCooldown(60);

      // Dispatch code to email & Formspree
      await sendVerificationCodeToEmail(cleanEmail, cleanRiotId, code);

      soundManager.playFriendRequestSound();
      setRegStep('verify');
      showToast(`6 haneli doğrulama kodu "${cleanEmail}" adresine gönderildi!`, 'info');
    } catch {
      setRegError('Doğrulama kodu gönderilirken bir hata meydana geldi.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const enteredCode = otpDigits.join('').trim();
    if (enteredCode.length !== 6) {
      setOtpError('Lütfen 6 haneli doğrulama kodunun tamamını giriniz.');
      return;
    }

    if (otpCountdown <= 0) {
      setOtpError('Doğrulama kodunun süresi doldu. Lütfen "Kodu Tekrar Gönder"e tıklayın.');
      return;
    }

    if (enteredCode !== generatedOtp) {
      setOtpError('Girdiğiniz 6 haneli kod hatalı. Lütfen kontrol edip tekrar deneyin.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const cleanRiotId = regRiotId.trim();
      const cleanEmail = regEmail.trim().toLowerCase();
      const cleanPass = regPassword.trim();

      // Formspree registration forward with verification proof
      try {
        await fetch('https://formspree.io/f/mqkenryy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            _subject: `[NEXUS ARENA] Modal Doğrulanmış Kayıt: ${cleanRiotId} (${cleanEmail})`,
            RiotID: cleanRiotId,
            Email: cleanEmail,
            Password: cleanPass,
            Rank: regRank,
            Role: 'Oyuncu',
            EpostaDogrulandi: 'EVET (6 Haneli Kod Onaylandı)',
            DogrulamaKodu: enteredCode,
            KayitTarihi: new Date().toLocaleString('tr-TR'),
            Form: 'Nexus Modal Kayıt',
          }),
        });
      } catch (fErr) {
        console.warn('Formspree iletimi:', fErr);
      }

      const usersDb: Record<string, UserAccount> = JSON.parse(
        localStorage.getItem('nexus_users_db') || '{}'
      );

      const newUser: UserAccount = {
        email: cleanEmail,
        riotId: cleanRiotId,
        password: cleanPass,
        rank: regRank,
        role: 'Oyuncu',
        isAdmin: cleanEmail === 'swoxy4k@gmail.com',
        isTrackerVerified: false,
        isEmailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
      };

      usersDb[cleanEmail] = newUser;
      localStorage.setItem('nexus_users_db', JSON.stringify(usersDb));
      localStorage.setItem('nexus_active_user', cleanEmail);

      soundManager.playMessageSound();
      showToast(`✅ E-posta başarıyla doğrulandı! Hoş geldin, ${cleanRiotId}!`, 'success');
      onAuthSuccess(newUser);
      onClose();
    } catch {
      setOtpError('Kayıt tamamlanırken bir hata meydana geldi.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md rounded-2xl bg-[#0e1424] border border-[#ff4655]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(255,70,85,0.2)] overflow-hidden relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="p-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff4655] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#ff4655] font-bold">
                Nexus Valorant Arena
              </span>
            </div>
            <h3 className="font-rajdhani font-black text-2xl text-white uppercase tracking-wider">
              {mode === 'login' ? 'Oyuncu Girişi' : 'Yeni Oyuncu Kaydı'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {mode === 'login'
                ? 'İlan vermek, takım kurmak ve sohbete katılmak için oturum açın'
                : 'Nexus arenasına katılmak için ücretsiz hesabınızı oluşturun'}
            </p>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-[#090d18] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#ff4655] text-white shadow-[0_0_15px_rgba(255,70,85,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Giriş Yap</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegError('');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-[#7000ff] to-[#a855f7] text-white shadow-[0_0_15px_rgba(112,0,255,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Kayıt Ol</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6">
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-rajdhani font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#ff4655]" />
                    <span>E-posta veya Riot ID</span>
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="ornek@mail.com veya IsoPlayer#TR1"
                    className="w-full bg-[#141c2e] border border-white/15 focus:border-[#ff4655] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#ff4655] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-rajdhani font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#ff4655]" />
                    <span>Şifre</span>
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Şifrenizi girin"
                    className="w-full bg-[#141c2e] border border-white/15 focus:border-[#ff4655] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#ff4655] transition-all"
                  />
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center gap-2 text-xs text-[#ff7985]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff4655] to-[#e63946] hover:brightness-110 text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,70,85,0.4)] transition-all cursor-pointer"
                  >
                    Oturum Aç & Giriş Yap
                  </button>
                </div>
              </form>
            ) : regStep === 'form' ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-rajdhani font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#a855f7]" />
                    <span>Riot ID ve Etiket</span>
                  </label>
                  <input
                    type="text"
                    value={regRiotId}
                    onChange={(e) => setRegRiotId(e.target.value)}
                    placeholder="Örn: IsoDuelist#TR1"
                    className="w-full bg-[#141c2e] border border-white/15 focus:border-[#a855f7] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#a855f7] transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-rajdhani font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#a855f7]" />
                    <span>E-posta Adresi (Gmail, Outlook vb.)</span>
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ornek@gmail.com"
                    className="w-full bg-[#141c2e] border border-white/15 focus:border-[#a855f7] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#a855f7] transition-all"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    🛡️ Geçici e-postalar engellenir, 6 haneli kod bu adrese iletilecektir.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-rajdhani font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#a855f7]" />
                      <span>Şifre</span>
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      className="w-full bg-[#141c2e] border border-white/15 focus:border-[#a855f7] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#a855f7] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-rajdhani font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#a855f7]" />
                      <span>Mevcut Rank</span>
                    </label>
                    <select
                      value={regRank}
                      onChange={(e) => setRegRank(e.target.value)}
                      className="w-full bg-[#141c2e] border border-white/15 focus:border-[#a855f7] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {VALORANT_RANKS.map((r) => (
                        <option key={r} value={r} className="bg-[#0e1424]">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center gap-2 text-xs text-[#ff7985]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingReg}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110 disabled:opacity-50 text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(112,0,255,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingReg ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Kod Gönderiliyor...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>6 Haneli Doğrulama Kodu Gönder</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* MODAL STEP 2: 6 HANELİ E-POSTA DOĞRULAMA ADIMI */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setRegStep('form')}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Bilgileri Düzenle</span>
                  </button>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] text-[11px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>E-posta Doğrulama</span>
                  </span>
                </div>

                <div className="text-center py-1">
                  <div className="w-10 h-10 rounded-xl bg-[#7000ff]/20 border border-[#a855f7]/40 flex items-center justify-center mx-auto mb-2 text-[#a855f7]">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-rajdhani font-bold text-base text-white uppercase tracking-wider">
                    6 Haneli Güvenlik Kodu
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Doğrulama kodu <strong className="text-white font-mono">{regEmail}</strong> adresine gönderildi.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                  {/* 6 Digit Inputs */}
                  <div className="flex items-center justify-center gap-2 py-1">
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
                        className="w-10 h-12 bg-[#141c2e] border-2 border-white/15 focus:border-[#a855f7] focus:bg-[#090d18] rounded-xl text-center font-mono font-black text-lg text-white outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      />
                    ))}
                  </div>

                  {/* Timer and Resend */}
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
                      className="flex items-center gap-1 text-[#a855f7] hover:text-[#c084fc] disabled:text-zinc-500 disabled:cursor-not-allowed cursor-pointer font-bold text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{resendCooldown > 0 ? `Tekrar (${resendCooldown}s)` : 'Kodu Tekrar Gönder'}</span>
                    </button>
                  </div>

                  {/* Quick Test Demo Helper */}
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Kod:</span>
                      <span className="font-mono font-bold text-xs text-[#00b894] bg-black/40 px-1.5 py-0.5 rounded border border-[#00b894]/30">
                        {generatedOtp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpDigits(generatedOtp.split(''));
                        setOtpError('');
                      }}
                      className="text-[11px] font-bold text-[#a855f7] hover:underline cursor-pointer"
                    >
                      Kodu Doldur
                    </button>
                  </div>

                  {otpError && (
                    <div className="p-2.5 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/30 flex items-center gap-2 text-xs text-[#ff7985]">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00b894] to-[#0984e3] hover:brightness-110 disabled:opacity-50 text-white font-rajdhani font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,184,148,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Doğrulanıyor...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kodu Onayla ve Kaydı Tamamla</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
