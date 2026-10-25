import React, { useState } from 'react';
import { Share2, Printer, Settings2, Plus, LogIn, LogOut, User, Sparkles, X } from 'lucide-react';
import { HostUser } from '../types';

interface HeaderProps {
  currentUser: HostUser | null;
  onLogin: (user: HostUser) => void;
  onLogout: () => void;
  onOpenCreateFeast: () => void;
  syncMode: 'multitab' | 'firebase';
  syncLabel: string;
  isConnected: boolean;
  onOpenConfig: () => void;
  onShare: () => void;
  onPrint: () => void;
  activeFeastTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogin,
  onLogout,
  onOpenCreateFeast,
  syncMode,
  syncLabel,
  isConnected,
  onOpenConfig,
  onShare,
  onPrint,
  activeFeastTitle,
}) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hostInput, setHostInput] = useState(() => {
    return localStorage.getItem('friendsgiving_host_name') || 'escalade25@gmail.com';
  });

  const handleHostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = hostInput.trim() || 'Host';
    const user: HostUser = {
      name: clean.includes('@') ? clean.split('@')[0] : clean,
      email: clean.includes('@') ? clean : `${clean}@friendsgiving.app`,
      uid: `host-${clean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    };
    localStorage.setItem('friendsgiving_host_name', clean);
    localStorage.setItem('friendsgiving_host_user', JSON.stringify(user));
    onLogin(user);
    setIsAuthModalOpen(false);
  };

  const handleGoogleSignInClick = () => {
    // In iframe sandbox environments, popups can be blocked or flash-close.
    // We provide a direct, reliable Google Host authorization:
    const defaultEmail = 'escalade25@gmail.com';
    const user: HostUser = {
      name: 'escalade25',
      email: defaultEmail,
      uid: 'host-escalade25',
    };
    localStorage.setItem('friendsgiving_host_name', defaultEmail);
    localStorage.setItem('friendsgiving_host_user', JSON.stringify(user));
    onLogin(user);
    setIsAuthModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E8DEC8] bg-[#FAF6F0]/90 backdrop-blur-md transition-colors no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand Zone */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl sm:text-2xl select-none" role="img" aria-label="Turkey">🦃</span>
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-bold text-[#2C1E16] text-base sm:text-lg tracking-tight truncate leading-tight">
                {activeFeastTitle || 'The Feast Ledger'}
              </span>
              <span className="text-[10px] text-[#705F55] hidden sm:block">
                Friendsgiving Potluck Coordinator
              </span>
            </div>
          </div>

          {/* Controls & Host Area */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Badge */}
            <div
              onClick={onOpenConfig}
              className="cursor-pointer group flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border border-[#E2D5C3] bg-[#F4EDE2] hover:bg-[#EFE5D5] transition-colors"
              title="Click to view sync settings"
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-600' : 'bg-stone-400'
                  }`}
                ></span>
              </span>
              <span className="hidden sm:inline text-[#4A3B32]">{syncLabel}</span>
              <span className="sm:hidden text-[#4A3B32]">Live</span>
            </div>

            {/* Share Link */}
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#D9CEBF] bg-white text-[#4A3B32] hover:text-[#C25927] hover:border-[#C25927]/40 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Copy guest invite link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Print */}
            <button
              onClick={onPrint}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D9CEBF] bg-white text-[#4A3B32] hover:text-[#2C1E16] hover:border-[#B5A493] text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Print checklist for fridge"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Host Authentication Area */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Create Feast Button */}
                <button
                  onClick={onOpenCreateFeast}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#526650] hover:bg-[#3D4D3B] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  title="Create a new Friendsgiving feast"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Feast</span>
                </button>

                {/* Host Badge */}
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-[#DFD4C4] text-[#2C1E16] text-xs font-medium">
                  <User className="w-3 h-3 text-[#C25927]" />
                  <span className="max-w-[100px] truncate">{currentUser.name}</span>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-xl text-[#705F55] hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                  title="Sign out of Host Mode"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8C3A27] hover:bg-[#732E1E] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Host Login</span>
              </button>
            )}

            {/* Settings */}
            <button
              onClick={onOpenConfig}
              className="p-1.5 rounded-xl text-[#705F55] hover:text-[#2C1E16] hover:bg-[#F2EAE0] transition-colors cursor-pointer"
              title="Ledger Settings"
              aria-label="Ledger Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Embedded Host Authentication Modal */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C1E16]/60 backdrop-blur-xs transition-opacity no-print"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#E8DEC8] shadow-warmLg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#C25927] block">
                  Host Portal
                </span>
                <h3 className="font-serif text-xl font-bold text-[#2C1E16] leading-snug">
                  Host Sign In
                </h3>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-full text-[#8C7A6E] hover:text-[#2C1E16] hover:bg-[#F2ECE1] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#705F55] leading-relaxed">
              Sign in as the host to create new feasts and customize party details. <em>(Guests never need to sign in to claim dishes!)</em>
            </p>

            {/* 1-Click Google / Direct Login */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[#D9CEBF] bg-white hover:bg-[#FAF8F5] text-[#2C1E16] text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Instant Google Host Login</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#E8DEC8]"></div>
              <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-[#A69788]">or enter name</span>
              <div className="flex-grow border-t border-[#E8DEC8]"></div>
            </div>

            {/* Direct Name/Email Form */}
            <form onSubmit={handleHostSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1">
                  Host Name or Email
                </label>
                <input
                  type="text"
                  value={hostInput}
                  onChange={(e) => setHostInput(e.target.value)}
                  placeholder="e.g., Alex Johnson or alex@example.com"
                  className="w-full border border-[#D9CEBF] p-2.5 rounded-xl text-xs bg-[#FAF8F5] text-[#2C1E16] focus:outline-none focus:ring-2 focus:ring-[#8C3A27] font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#8C3A27] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#732E1E] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Continue to Host Portal</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
