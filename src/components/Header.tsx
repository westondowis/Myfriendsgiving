import React from 'react';
import { Share2, Printer, Settings2, RefreshCw } from 'lucide-react';

interface HeaderProps {
  syncMode: 'multitab' | 'firebase';
  syncLabel: string;
  isConnected: boolean;
  onOpenConfig: () => void;
  onShare: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncMode,
  syncLabel,
  isConnected,
  onOpenConfig,
  onShare,
  onPrint,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E8DEC8] bg-[#FAF6F0]/90 backdrop-blur-md transition-colors no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl select-none" role="img" aria-label="Turkey">🦃</span>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-[#2C1E16] text-base sm:text-lg tracking-tight truncate leading-tight">
              The Feast Ledger
            </span>
          </div>
        </div>

        {/* Sync Status & Action Affordances */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Real-time Status Badge */}
          <div
            onClick={onOpenConfig}
            className="cursor-pointer group flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border border-[#E2D5C3] bg-[#F4EDE2] hover:bg-[#EFE5D5] transition-colors"
            title="Click to view cross-device sync settings"
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected
                    ? syncMode === 'firebase'
                      ? 'bg-amber-600'
                      : 'bg-emerald-600'
                    : 'bg-stone-400'
                }`}
              ></span>
            </span>
            <span className="hidden sm:inline text-[#4A3B32]">{syncLabel}</span>
            <span className="sm:hidden text-[#4A3B32]">
              {syncMode === 'firebase' ? 'Cloud' : 'Live'}
            </span>
          </div>

          {/* Share Button */}
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D9CEBF] bg-white text-[#4A3B32] hover:text-[#C25927] hover:border-[#C25927]/40 text-xs font-semibold shadow-xs transition active:scale-95"
            aria-label="Share potluck ledger link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share Link</span>
          </button>

          {/* Print Button */}
          <button
            onClick={onPrint}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D9CEBF] bg-white text-[#4A3B32] hover:text-[#2C1E16] hover:border-[#B5A493] text-xs font-semibold shadow-xs transition active:scale-95"
            aria-label="Print ledger for fridge"
            title="Print a fridge checklist"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Fridge Print</span>
          </button>

          {/* Settings / Cloud Modal trigger */}
          <button
            onClick={onOpenConfig}
            className="p-1.5 rounded-xl text-[#705F55] hover:text-[#2C1E16] hover:bg-[#F2EAE0] transition-colors"
            aria-label="Database and sync settings"
            title="Sync & Database Setup"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
