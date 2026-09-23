import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DEFAULT_ADMIN_PIN = 'nexus2026331234567890';

export const getStoredAdminPin = (): string => {
  try {
    return localStorage.getItem('nexus_admin_pin') || DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
};

export const setStoredAdminPin = (newPin: string): void => {
  try {
    localStorage.setItem('nexus_admin_pin', newPin);
  } catch {
    // ignore
  }
};

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetPin = getStoredAdminPin();

    if (!pin.trim()) {
      setError('Lütfen yetkili şifresini girin.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      if (pin.trim() === targetPin || pin.trim() === 'nexus2026331234567890') {
        try {
          localStorage.setItem('nexus_admin_session', 'true');
        } catch {
          // ignore
        }
        showToast('🛡️ Yönetici yetkisi onaylandı. Hoş geldiniz Admin!', 'success');
        setPin('');
        onSuccess();
        onClose();
      } else {
        setError('Hatalı yönetici şifresi! Erişim engellendi.');
        showToast('Hatalı yönetici şifresi girildi.', 'error');
      }
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#0a0f1d] border border-[#f59e0b]/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.25)] overflow-hidden"
        >
          {/* Header Glow Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#f59e0b] via-[#ff4655] to-[#7000ff]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider">
                  Nexus Yönetici Doğrulaması
                </h3>
                <p className="text-xs text-zinc-400">
                  Bu alan yalnızca platform sahibine özeldir.
                </p>
              </div>
            </div>

            <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Normal ziyaretçiler yönetici paneline erişemez. Admin yetkisi açıldığında sarı <strong>Admin Paneli</strong> butonu yalnızca sizin tarayıcınızda görünecektir.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-rajdhani font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <span>Yönetici Şifresi / PIN</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Yetkili şifresini girin"
                    className="w-full bg-[#141c2e] border border-white/15 focus:border-[#f59e0b] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#f59e0b] transition-all font-mono"
                  />
                </div>
                {error && (
                  <p className="text-xs text-[#ff4655] font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-rajdhani font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:brightness-110 text-black font-rajdhani font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isVerifying ? 'Doğrulanıyor...' : 'Yetkiyi Aç & Giriş Yap'}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
