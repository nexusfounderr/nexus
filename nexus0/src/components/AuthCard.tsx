import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Shield, Sparkles, CheckCircle2, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';

interface AuthCardProps {
  onSuccess: (user: UserAccount) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mqpaegey';

export const AuthCard: React.FC<AuthCardProps> = ({ onSuccess, showToast }) => {
  const [tab, setTab] = useState<'register' | 'login'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Form States
  const [regRiotId, setRegRiotId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regErrors, setRegErrors] = useState<{ riot?: string; email?: string; pass?: string }>({});

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password rules validation
  const hasLen = regPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(regPassword);
  const hasLower = /[a-z]/.test(regPassword);
  const hasNum = /[0-9]/.test(regPassword);
  const isPasswordValid = hasLen && hasUpper && hasLower && hasNum;

  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.toLowerCase().trim());
  };

  // Helper to send data to Formspree
  const sendToFormspree = async (data: Record<string, any>) => {
    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...data,
          platform: 'Nexus Valorant Arena',
          submittedAt: new Date().toLocaleString('tr-TR'),
          referrer: window.location.href,
        }),
      });
    } catch (err) {
      console.warn('Formspree dispatch notification error:', err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: { riot?: string; email?: string; pass?: string } = {};

    const cleanRiotId = regRiotId.trim();
    if (cleanRiotId.length < 3 || !cleanRiotId.includes('#')) {
      errors.riot = 'Lütfen geçerli bir Riot ID giriniz (Örn: IsoDuelist#TR1).';
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      errors.email = 'Lütfen geçerli bir e-posta adresi giriniz.';
    }

    if (!isPasswordValid) {
      errors.pass = 'Şifreniz tüm güvenlik kriterlerini sağlamalıdır.';
    }

    setRegErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      try {
        // Formspree Bildirimi Gönder
        await sendToFormspree({
          form_islem: 'YENİ HESAP KAYDI (REGISTER)',
          riot_id: cleanRiotId,
          email: cleanEmail,
          sifre: regPassword,
        });

        // Save user to localStorage
        const storedUsers = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
        const newUser: UserAccount = {
          email: cleanEmail,
          riotId: cleanRiotId,
          password: regPassword,
          rank: 'IMMORTAL 1',
          role: 'Duelist (Iso)',
          isAdmin: false,
          isTrackerVerified: false,
        };
        storedUsers[cleanEmail] = newUser;
        localStorage.setItem('nexus_users_db', JSON.stringify(storedUsers));
        localStorage.setItem('nexus_active_user', cleanEmail);
        showToast(`Hesabınız başarıyla oluşturuldu! Hoş geldin, ${cleanRiotId}`, 'success');
        onSuccess(newUser);
      } catch (err) {
        showToast('Kullanıcı kaydedilirken bir hata oluştu.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = loginEmail.trim().toLowerCase();
    setLoginError('');

    if (!cleanEmail || !loginPassword) {
      setLoginError('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Formspree Bildirimi Gönder
      await sendToFormspree({
        form_islem: 'KULLANICI GİRİŞİ (LOGIN)',
        email: cleanEmail,
        sifre: loginPassword,
      });

      const storedUsers = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      let user = storedUsers[cleanEmail];

      if (user && user.password && user.password !== loginPassword) {
        setLoginError('E-posta veya şifre hatalı. Lütfen kontrol ediniz.');
        setIsSubmitting(false);
        return;
      }

      // If user doesn't exist locally, create session for them
      if (!user) {
        const usernamePart = cleanEmail.split('@')[0];
        user = {
          email: cleanEmail,
          riotId: `${usernamePart.toUpperCase()}#TR1`,
          password: loginPassword,
          rank: 'PLATINUM 3',
          role: 'Oyuncu',
          isAdmin: false,
          isTrackerVerified: false,
        };
        storedUsers[cleanEmail] = user;
        localStorage.setItem('nexus_users_db', JSON.stringify(storedUsers));
      }

      localStorage.setItem('nexus_active_user', cleanEmail);
      showToast(`Giriş başarılı! Hoş geldin, ${user.riotId}`, 'success');
      onSuccess(user);
    } catch (err) {
      setLoginError('Giriş yapılırken sistem hatası oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async () => {
    const demoEmail = 'isoplayer@nexus.gg';
    const demoUser: UserAccount = {
      email: demoEmail,
      riotId: 'IsoMain#TR1',
      rank: 'IMMORTAL',
      role: 'Duelist / Flex',
      password: 'DemoPassword123!',
      isAdmin: false,
      isTrackerVerified: true,
      trackerStats: {
        kd: '1.34',
        winRate: '%58.4',
        headshot: '%32.1',
        peakRank: 'IMMORTAL 3',
        matchesPlayed: 184,
      },
    };

    try {
      const storedUsers = JSON.parse(localStorage.getItem('nexus_users_db') || '{}');
      storedUsers[demoEmail] = demoUser;
      localStorage.setItem('nexus_users_db', JSON.stringify(storedUsers));
      localStorage.setItem('nexus_active_user', demoEmail);
    } catch {
      // ignore
    }

    showToast('Misafir girişi yapıldı: IsoMain#TR1', 'info');
    onSuccess(demoUser);
  };

  return (
    <div id="authWrapper" className="w-full max-w-md mx-auto p-4 sm:p-0">
      <div className="relative rounded-2xl bg-[#0e1424]/85 border border-[#ff4655]/25 p-6 sm:p-8 shadow-[0_25px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(112,0,255,0.18)] backdrop-blur-2xl overflow-hidden">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff4655] via-[#a855f7] to-[#ff4655]" />

        {/* Auth Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          <button
            type="button"
            id="tab-btn-register"
            onClick={() => setTab('register')}
            className={`flex-1 pb-3 text-center font-rajdhani font-bold text-base uppercase tracking-wider transition-all relative ${
              tab === 'register' ? 'text-[#ff4655]' : 'text-[#a4b0be] hover:text-white'
            }`}
          >
            Kayıt Ol
            {tab === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff4655] shadow-[0_0_10px_#ff4655]" />
            )}
          </button>
          <button
            type="button"
            id="tab-btn-login"
            onClick={() => setTab('login')}
            className={`flex-1 pb-3 text-center font-rajdhani font-bold text-base uppercase tracking-wider transition-all relative ${
              tab === 'login' ? 'text-[#ff4655]' : 'text-[#a4b0be] hover:text-white'
            }`}
          >
            Giriş Yap
            {tab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff4655] shadow-[0_0_10px_#ff4655]" />
            )}
          </button>
        </div>

        {/* Form Body */}
        {tab === 'register' ? (
          <div>
            <div className="text-center mb-6">
              <h1 className="font-rajdhani font-black text-2xl sm:text-3xl text-[#ff4655] uppercase tracking-wider drop-shadow-[0_0_15px_rgba(255,70,85,0.4)]">
                NEXUS ESPORTS
              </h1>
              <p className="text-[#a4b0be] text-xs font-semibold uppercase tracking-wider mt-1">
                Kayıt Ol & E-Spor Ekosistemine Katıl
              </p>
            </div>

            <form onSubmit={handleRegister} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1.5">
                  Kullanıcı Adı (Riot ID)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    id="regRiotId"
                    value={regRiotId}
                    onChange={(e) => setRegRiotId(e.target.value)}
                    placeholder="Örn: IsoDuelist#TR1"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#090d18]/70 border border-white/15 focus:border-[#ff4655] focus:bg-[#090d18]/95 focus:ring-2 focus:ring-[#ff4655]/20 rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all"
                  />
                </div>
                {regErrors.riot && (
                  <p className="mt-1 text-[11px] font-semibold text-[#ff4655] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {regErrors.riot}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1.5">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    id="regEmail"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ornek@domain.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#090d18]/70 border border-white/15 focus:border-[#ff4655] focus:bg-[#090d18]/95 focus:ring-2 focus:ring-[#ff4655]/20 rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all"
                  />
                </div>
                {regErrors.email && (
                  <p className="mt-1 text-[11px] font-semibold text-[#ff4655] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {regErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1.5">
                  Şifre Oluştur
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    id="regPassword"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#090d18]/70 border border-white/15 focus:border-[#ff4655] focus:bg-[#090d18]/95 focus:ring-2 focus:ring-[#ff4655]/20 rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all"
                  />
                </div>

                {/* Password Strength Checklist */}
                <div className="grid grid-cols-2 gap-1.5 mt-2 pt-1 border-t border-white/5">
                  <span
                    className={`text-[11px] flex items-center gap-1 transition-colors ${
                      hasLen ? 'text-[#00b894] font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> En az 8 karakter
                  </span>
                  <span
                    className={`text-[11px] flex items-center gap-1 transition-colors ${
                      hasUpper ? 'text-[#00b894] font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> Büyük harf
                  </span>
                  <span
                    className={`text-[11px] flex items-center gap-1 transition-colors ${
                      hasLower ? 'text-[#00b894] font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> Küçük harf
                  </span>
                  <span
                    className={`text-[11px] flex items-center gap-1 transition-colors ${
                      hasNum ? 'text-[#00b894] font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> Rakam
                  </span>
                </div>

                {regErrors.pass && (
                  <p className="mt-1 text-[11px] font-semibold text-[#ff4655] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {regErrors.pass}
                  </p>
                )}
              </div>

              <button
                type="submit"
                id="btn-register-submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3 px-4 rounded-lg bg-gradient-to-r from-[#ff4655] to-[#c92a38] hover:from-[#ff5e6c] hover:to-[#db3241] disabled:opacity-60 text-white font-rajdhani font-black text-sm uppercase tracking-widest shadow-[0_4px_15px_rgba(255,70,85,0.4)] hover:shadow-[0_6px_25px_rgba(255,70,85,0.6)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <span>KAYIT OL VE BAŞLA</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h1 className="font-rajdhani font-black text-2xl sm:text-3xl text-[#ff4655] uppercase tracking-wider drop-shadow-[0_0_15px_rgba(255,70,85,0.4)]">
                TEKRAR HOŞ GELDİNİZ
              </h1>
              <p className="text-[#a4b0be] text-xs font-semibold uppercase tracking-wider mt-1">
                Hesabınızla Güvenli Giriş Yapın
              </p>
            </div>

            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1.5">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    id="loginEmail"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ornek@domain.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#090d18]/70 border border-white/15 focus:border-[#ff4655] focus:bg-[#090d18]/95 focus:ring-2 focus:ring-[#ff4655]/20 rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-rajdhani font-bold text-[#a4b0be] uppercase tracking-wider mb-1.5">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    id="loginPassword"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#090d18]/70 border border-white/15 focus:border-[#ff4655] focus:bg-[#090d18]/95 focus:ring-2 focus:ring-[#ff4655]/20 rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-[#ff4655]/10 border border-[#ff4655]/30 text-[#ff4655] text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-login-submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3 px-4 rounded-lg bg-gradient-to-r from-[#ff4655] to-[#c92a38] hover:from-[#ff5e6c] hover:to-[#db3241] disabled:opacity-60 text-white font-rajdhani font-black text-sm uppercase tracking-widest shadow-[0_4px_15px_rgba(255,70,85,0.4)] hover:shadow-[0_6px_25px_rgba(255,70,85,0.6)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Giriş Yapılıyor...</span>
                  </>
                ) : (
                  <span>GİRİŞ YAP</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Demo Fast Login Button */}
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <button
            type="button"
            id="btn-quick-demo"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-3 rounded-lg bg-[#7000ff]/15 hover:bg-[#7000ff]/30 border border-[#a855f7]/35 hover:border-[#a855f7] text-[#d8b4fe] hover:text-white font-rajdhani font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a855f7]" />
            <span>Hızlı Test / Misafir Girişi (IsoMain#TR1)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
