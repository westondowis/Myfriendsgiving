import React, { useState } from 'react';
import { X, Database, Check, ShieldCheck, AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFirebaseUrl: string;
  onSaveFirebaseConfig: (url: string) => void;
  onResetDefaults: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  currentFirebaseUrl,
  onSaveFirebaseConfig,
  onResetDefaults,
  onShowToast,
}) => {
  const [urlInput, setUrlInput] = useState(currentFirebaseUrl);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveFirebaseConfig(urlInput.trim());
    onShowToast('Sync configuration updated!', '💾');
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to completely reset all dishes and claims back to defaults?')) {
      onResetDefaults();
      onShowToast('Ledger reset to default 14 curated items!', '🧹');
      onClose();
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      onShowToast('Feast link copied to clipboard!', '📋');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C1E16]/60 backdrop-blur-xs transition-opacity duration-200 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#E8DEC8] shadow-warmLg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#705F55] block">
              Cross-Device Persistence & Sync
            </span>
            <h3 className="font-serif text-xl font-bold text-[#2C1E16]">
              Sync & Database Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8C7A6E] hover:text-[#2C1E16] hover:bg-[#F2ECE1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status explanation */}
        <div className="space-y-3 text-xs text-[#4A3B32] leading-relaxed mb-5">
          <div className="p-3 rounded-2xl bg-[#EBF0EA] border border-[#CFDFCF] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-950 font-semibold">Zero-Login & Instant Multi-Tab Sync Active:</strong>
              <p className="mt-0.5 text-emerald-900">
                Any changes made in this window instantly update across all other tabs on this device with zero delay.
              </p>
            </div>
          </div>

          <p>
            To sync in real-time across <strong>multiple phones, laptops, and guests</strong> anywhere on the internet, provide a Firebase Realtime Database URL (with public read/write rules enabled).
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="firebaseInput"
              className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1.5"
            >
              Firebase Realtime Database URL (Optional)
            </label>
            <input
              id="firebaseInput"
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-project-default-rtdb.firebaseio.com"
              className="w-full px-3.5 py-2.5 font-mono text-xs rounded-xl border border-[#D9CEBF] focus:outline-none focus:ring-2 focus:ring-[#C25927] bg-[#FAF8F5] text-[#2C1E16]"
            />
            <p className="mt-1.5 text-[11px] text-[#705F55]">
              Leave blank to use browser local storage + broadcast channels.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2.5 px-3 rounded-xl border border-[#D9CEBF] text-[#4A3B32] font-semibold text-xs hover:bg-[#F3EDE2] transition flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Feast URL</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#C25927] hover:bg-[#A6471B] text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Reconnect</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#EAE0D1] flex items-center justify-between">
            <button
              onClick={handleReset}
              className="text-xs text-red-700 hover:text-red-800 font-semibold underline underline-offset-2 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset All Items to Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
