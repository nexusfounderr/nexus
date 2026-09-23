import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Evet, Onayla',
  cancelText = 'Vazgeç',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#0d1424] border border-[#ff4655]/40 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(255,70,85,0.25)] relative">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#ff4655]/15 border border-[#ff4655]/40 flex items-center justify-center shrink-0 text-[#ff4655]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="font-rajdhani font-black text-xl text-white uppercase tracking-wider leading-snug">
              {title}
            </h3>
            <p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-rajdhani font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-lg text-white text-xs font-rajdhani font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer ${
              isDanger
                ? 'bg-gradient-to-r from-[#ff4655] to-[#c92a38] hover:brightness-110 shadow-[0_4px_15px_rgba(255,70,85,0.4)]'
                : 'bg-gradient-to-r from-[#7000ff] to-[#a855f7] hover:brightness-110'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
